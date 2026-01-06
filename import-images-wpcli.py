#!/usr/bin/env python3
import requests
from requests.auth import HTTPBasicAuth
import json
import subprocess
import time
import os
import hashlib
from urllib.parse import urlparse

DEST_URL = "https://cms.climaticpro.ro"
DEST_KEY = "ck_6e3eef12ca191def4c8c933dfa5a6d5b658189b1"
DEST_SECRET = "cs_0ce184308506a19a94ce12553c573d3f31105e4b"
CONTAINER = "climaticpro-wordpress-1"
EXPORT_DIR = "/home/asns/projects/climaticpro/export"
IMAGES_DIR = "/home/asns/projects/climaticpro/images"

os.makedirs(IMAGES_DIR, exist_ok=True)

def download_image(url):
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

def upload_image_wpcli(local_path):
    try:
        container_path = f"/tmp/{os.path.basename(local_path)}"
        subprocess.run(['docker', 'cp', local_path, f'{CONTAINER}:{container_path}'], 
                      capture_output=True, timeout=30)
        
        cmd = ['docker', 'exec', CONTAINER, 'wp', 'media', 'import',
               container_path, '--porcelain', '--allow-root']
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            media_id = result.stdout.strip()
            subprocess.run(['docker', 'exec', CONTAINER, 'rm', container_path],
                         capture_output=True, timeout=10)
            return int(media_id)
    except:
        pass
    return None

def update_product_images(product_id, image_ids):
    auth = HTTPBasicAuth(DEST_KEY, DEST_SECRET)
    images = [{'id': img_id} for img_id in image_ids]
    
    try:
        response = requests.put(
            f"{DEST_URL}/wp-json/wc/v3/products/{product_id}",
            auth=auth, json={'images': images}, timeout=30)
        return response.status_code == 200
    except:
        return False

print("🚀 Import imagini prin WP-CLI")
print("=" * 70)

with open(f"{EXPORT_DIR}/products.json", 'r') as f:
    products = json.load(f)

auth = HTTPBasicAuth(DEST_KEY, DEST_SECRET)
response = requests.get(f"{DEST_URL}/wp-json/wc/v3/products?per_page=100", auth=auth)

if response.status_code != 200:
    print("❌ Failed to get products")
    exit(1)

wp_products = {p['name']: p for p in response.json()}
print(f"📊 Found {len(wp_products)} products")
print(f"📊 Processing {len(products)} products\n")

stats = {'processed': 0, 'images': 0, 'updated': 0}

for product in products:
    name = product.get('name')
    if not name or name not in wp_products:
        continue
    
    wp_product = wp_products[name]
    print(f"\n📦 {name[:60]}...")
    
    image_ids = []
    if product.get('images'):
        for img in product['images'][:3]:
            img_url = img.get('src')
            if not img_url:
                continue
            
            local_path = download_image(img_url)
            if not local_path:
                continue
            
            media_id = upload_image_wpcli(local_path)
            if media_id:
                image_ids.append(media_id)
                print(f"  ✅ Image ID: {media_id}")
                stats['images'] += 1
    
    if image_ids:
        if update_product_images(wp_product['id'], image_ids):
            print(f"  ✅ Updated with {len(image_ids)} images")
            stats['updated'] += 1
    
    stats['processed'] += 1
    time.sleep(0.5)

print("\n" + "=" * 70)
print("✅ Import complet!")
print(f"�� Processed: {stats['processed']}, Images: {stats['images']}, Updated: {stats['updated']}")
print("=" * 70)
