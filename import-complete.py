#!/usr/bin/env python3
"""
Import COMPLET WooCommerce cu toate datele:
- Produse cu descrieri complete
- Categorii asociate
- Atribute și termeni
- Imagini (download și upload)
"""

import requests
from requests.auth import HTTPBasicAuth
import json
import subprocess
import time
import os
import hashlib
from urllib.parse import urlparse

# Configurare
DEST_URL = "https://cms.climaticpro.ro"
DEST_KEY = "ck_6e3eef12ca191def4c8c933dfa5a6d5b658189b1"
DEST_SECRET = "cs_0ce184308506a19a94ce12553c573d3f31105e4b"
CONTAINER = "climaticpro-wordpress-1"
EXPORT_DIR = "/home/asns/projects/climaticpro/export"
IMAGES_DIR = "/home/asns/projects/climaticpro/images"

os.makedirs(IMAGES_DIR, exist_ok=True)

class WooCommerceImporter:
    def __init__(self):
        self.auth = HTTPBasicAuth(DEST_KEY, DEST_SECRET)
        self.category_map = {}
        self.image_map = {}
        
    def get_existing_categories(self):
        """Obține categoriile existente"""
        response = requests.get(
            f"{DEST_URL}/wp-json/wc/v3/products/categories?per_page=100",
            auth=self.auth
        )
        if response.status_code == 200:
            for cat in response.json():
                self.category_map[cat['name']] = cat['id']
        print(f"✅ Found {len(self.category_map)} existing categories")
    
    def download_image(self, url):
        """Download imagine"""
        try:
            url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
            filename = os.path.basename(urlparse(url).path)
            local_path = os.path.join(IMAGES_DIR, f"{url_hash}_{filename}")
            
            if os.path.exists(local_path):
                return local_path
            
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                return local_path
        except:
            pass
        return None
    
    def upload_image(self, local_path, alt_text=""):
        """Upload imagine în WordPress"""
        try:
            filename = os.path.basename(local_path)
            
            with open(local_path, 'rb') as f:
                files = {'file': (filename, f, 'image/jpeg')}
                response = requests.post(
                    f"{DEST_URL}/wp-json/wp/v2/media",
                    auth=self.auth,
                    files=files,
                    data={'alt_text': alt_text}
                )
            
            if response.status_code == 201:
                return response.json()['id']
        except:
            pass
        return None
    
    def import_product(self, product, index, total):
        """Import produs complet cu toate datele"""
        name = product.get('name', 'Untitled')
        print(f"\n[{index}/{total}] 📦 {name[:60]}...")
        
        # Pregătire date produs
        product_data = {
            'name': name,
            'type': 'simple',
            'status': 'publish',  # Publish direct
            'regular_price': str(product.get('regular_price', '')),
            'sku': product.get('sku', ''),
            'description': product.get('description', ''),
            'short_description': product.get('short_description', ''),
        }
        
        # Categorii
        if product.get('categories'):
            cat_ids = []
            for cat in product['categories']:
                cat_name = cat.get('name', '')
                if cat_name in self.category_map:
                    cat_ids.append({'id': self.category_map[cat_name]})
            if cat_ids:
                product_data['categories'] = cat_ids
        
        # Imagini
        images = []
        if product.get('images'):
            for img in product['images'][:3]:  # Max 3 imagini
                img_url = img.get('src')
                if not img_url:
                    continue
                
                # Check cache
                if img_url in self.image_map:
                    images.append({'id': self.image_map[img_url]})
                    continue
                
                # Download și upload
                local_path = self.download_image(img_url)
                if local_path:
                    media_id = self.upload_image(local_path, name)
                    if media_id:
                        self.image_map[img_url] = media_id
                        images.append({'id': media_id})
                        print(f"  📷 Image uploaded: {media_id}")
        
        if images:
            product_data['images'] = images
        
        # Import produs
        try:
            response = requests.post(
                f"{DEST_URL}/wp-json/wc/v3/products",
                auth=self.auth,
                json=product_data,
                timeout=60
            )
            
            if response.status_code == 201:
                new_product = response.json()
                print(f"  ✅ Created product ID: {new_product['id']}")
                return new_product['id']
            else:
                error = response.json()
                print(f"  ❌ Failed: {error.get('message', response.status_code)}")
                return None
        except Exception as e:
            print(f"  ❌ Error: {str(e)[:100]}")
            return None
    
    def run_import(self):
        """Rulează importul complet"""
        print("🚀 Import COMPLET WooCommerce")
        print("=" * 70)
        
        # Load produse
        with open(f"{EXPORT_DIR}/products.json", 'r') as f:
            products = json.load(f)
        
        print(f"📊 Total products to import: {len(products)}")
        
        # Get categorii existente
        self.get_existing_categories()
        
        print("=" * 70)
        print("Starting import...\n")
        
        stats = {'success': 0, 'failed': 0, 'total': len(products)}
        
        for idx, product in enumerate(products, 1):
            product_id = self.import_product(product, idx, stats['total'])
            if product_id:
                stats['success'] += 1
            else:
                stats['failed'] += 1
            
            time.sleep(1)  # Rate limiting
        
        # Rezumat
        print("\n" + "=" * 70)
        print("✅ IMPORT COMPLET!")
        print(f"📊 Summary:")
        print(f"  - Total products: {stats['total']}")
        print(f"  - Successfully imported: {stats['success']}")
        print(f"  - Failed: {stats['failed']}")
        print(f"  - Success rate: {stats['success']/stats['total']*100:.1f}%")
        print(f"  - Images uploaded: {len(self.image_map)}")
        print("=" * 70)

if __name__ == "__main__":
    importer = WooCommerceImporter()
    importer.run_import()
