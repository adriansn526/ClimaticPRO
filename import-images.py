#!/usr/bin/env python3
"""
Script pentru download și import imagini produse WooCommerce
"""

import requests
from requests.auth import HTTPBasicAuth
import json
import os
import time
from urllib.parse import urlparse
import hashlib

# Configurare
SOURCE_URL = "https://climaticpro.ro"
DEST_URL = "https://cms.climaticpro.ro"
DEST_CONSUMER_KEY = "ck_6e3eef12ca191def4c8c933dfa5a6d5b658189b1"
DEST_CONSUMER_SECRET = "cs_0ce184308506a19a94ce12553c573d3f31105e4b"

# Directoare
IMAGES_DIR = "/home/asns/projects/climaticpro/images"
os.makedirs(IMAGES_DIR, exist_ok=True)

class ImageImporter:
    def __init__(self):
        self.dest_auth = HTTPBasicAuth(DEST_CONSUMER_KEY, DEST_CONSUMER_SECRET)
        self.image_map = {}  # URL vechi -> ID nou
        
    def download_image(self, image_url: str) -> str:
        """Descarcă o imagine și returnează calea locală"""
        try:
            # Generare nume fișier unic
            url_hash = hashlib.md5(image_url.encode()).hexdigest()[:8]
            filename = os.path.basename(urlparse(image_url).path)
            local_path = os.path.join(IMAGES_DIR, f"{url_hash}_{filename}")
            
            # Skip dacă există deja
            if os.path.exists(local_path):
                print(f"    ⏭️  Already downloaded: {filename}")
                return local_path
            
            # Download
            response = requests.get(image_url, timeout=30)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                print(f"    ✅ Downloaded: {filename} ({len(response.content)} bytes)")
                return local_path
            else:
                print(f"    ❌ Failed to download {image_url}: {response.status_code}")
                return None
        except Exception as e:
            print(f"    ❌ Error downloading {image_url}: {str(e)}")
            return None
    
    def upload_to_wordpress(self, local_path: str, alt_text: str = "") -> int:
        """Upload imagine în WordPress Media Library"""
        try:
            filename = os.path.basename(local_path)
            
            # Citire fișier
            with open(local_path, 'rb') as f:
                files = {
                    'file': (filename, f, 'image/jpeg')
                }
                
                # Upload prin WordPress REST API
                response = requests.post(
                    f"{DEST_URL}/wp-json/wp/v2/media",
                    auth=self.dest_auth,
                    files=files,
                    data={'alt_text': alt_text}
                )
            
            if response.status_code == 201:
                media = response.json()
                print(f"    ✅ Uploaded to WordPress: ID {media['id']}")
                return media['id']
            else:
                print(f"    ❌ Failed to upload {filename}: {response.status_code}")
                print(f"       Error: {response.text[:200]}")
                return None
        except Exception as e:
            print(f"    ❌ Error uploading {local_path}: {str(e)}")
            return None
    
    def process_product_images(self, product: dict) -> dict:
        """Procesează imaginile unui produs"""
        print(f"\n📦 Processing: {product['name'][:60]}")
        
        new_images = []
        
        # Procesare imagini din galerie
        if product.get('images'):
            for idx, img in enumerate(product['images']):
                image_url = img.get('src')
                if not image_url:
                    continue
                
                # Check dacă am procesat deja această imagine
                if image_url in self.image_map:
                    new_images.append({'id': self.image_map[image_url]})
                    print(f"  Image {idx+1}: Using cached ID {self.image_map[image_url]}")
                    continue
                
                # Download
                local_path = self.download_image(image_url)
                if not local_path:
                    continue
                
                # Upload
                alt_text = img.get('alt', product['name'])
                media_id = self.upload_to_wordpress(local_path, alt_text)
                if media_id:
                    self.image_map[image_url] = media_id
                    new_images.append({'id': media_id})
                
                time.sleep(0.5)  # Rate limiting
        
        return new_images
    
    def update_product_images(self, product_id: int, images: list):
        """Actualizează imaginile unui produs în WooCommerce"""
        try:
            response = requests.put(
                f"{DEST_URL}/wp-json/wc/v3/products/{product_id}",
                auth=self.dest_auth,
                json={'images': images}
            )
            
            if response.status_code == 200:
                print(f"  ✅ Updated product {product_id} with {len(images)} images")
                return True
            else:
                print(f"  ❌ Failed to update product {product_id}: {response.status_code}")
                return False
        except Exception as e:
            print(f"  ❌ Error updating product {product_id}: {str(e)}")
            return False
    
    def import_all_images(self):
        """Import toate imaginile produselor"""
        print("🚀 Starting image import...")
        print(f"📍 Source: {SOURCE_URL}")
        print(f"📍 Destination: {DEST_URL}")
        print("=" * 60)
        
        # Încărcare produse din JSON
        with open('/home/asns/projects/climaticpro/export/products.json', 'r') as f:
            products = json.load(f)
        
        # Obține produse existente din WordPress
        response = requests.get(
            f"{DEST_URL}/wp-json/wc/v3/products?per_page=100",
            auth=self.dest_auth
        )
        
        if response.status_code != 200:
            print("❌ Failed to get products from WordPress")
            return
        
        # Mapare după nume (nu SKU)
        wp_products = {p['name']: p for p in response.json()}
        print(f"📊 Found {len(wp_products)} products in WordPress")
        print(f"📊 Processing {len(products)} products from export")
        
        # Procesare imagini pentru fiecare produs
        stats = {'processed': 0, 'images_downloaded': 0, 'images_uploaded': 0, 'updated': 0}
        
        for product in products:
            product_name = product.get('name')
            if not product_name or product_name not in wp_products:
                print(f"\n⏭️  Skipping {product_name[:60]} (not found in WordPress)")
                continue
            
            wp_product = wp_products[product_name]
            
            # Procesare imagini
            new_images = self.process_product_images(product)
            
            if new_images:
                # Actualizare produs cu imagini
                if self.update_product_images(wp_product['id'], new_images):
                    stats['updated'] += 1
                stats['images_uploaded'] += len(new_images)
            
            stats['processed'] += 1
            time.sleep(1)  # Rate limiting
        
        # Rezumat
        print("\n" + "=" * 60)
        print("✅ Image import complete!")
        print(f"📊 Summary:")
        print(f"  - Products processed: {stats['processed']}")
        print(f"  - Images uploaded: {stats['images_uploaded']}")
        print(f"  - Products updated: {stats['updated']}")
        print(f"  - Cached images: {len(self.image_map)}")

if __name__ == "__main__":
    importer = ImageImporter()
    importer.import_all_images()
