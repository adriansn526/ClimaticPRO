#!/usr/bin/env python3
import json
import subprocess
import time
import re

CONTAINER = "climaticpro-wordpress-1"
EXPORT_FILE = "/home/asns/projects/climaticpro/export/products.json"

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('"', '\\"').replace('$', '\\$').replace('`', '\\`')
    return text[:500]

def import_product(product, index, total):
    name = clean_text(product.get('name', 'Untitled'))
    sku = product.get('sku', '')
    price = product.get('regular_price', '')
    
    print(f"\n[{index}/{total}] {name[:60]}...")
    
    cmd = [
        'docker', 'exec', CONTAINER, 'wp', 'wc', 'product', 'create',
        f'--name={name}',
        '--type=simple',
        f'--regular_price={price}',
        f'--sku={sku}',
        '--status=draft',
        '--user=1',
        '--allow-root',
        '--porcelain'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            product_id = result.stdout.strip()
            print(f"  ✅ ID: {product_id}")
            return product_id
        else:
            print(f"  ❌ Failed")
            return None
    except Exception as e:
        print(f"  ❌ Error: {str(e)[:50]}")
        return None

with open(EXPORT_FILE, 'r') as f:
    products = json.load(f)

print(f"🚀 Importing {len(products)} products...")
stats = {'success': 0, 'failed': 0}

for idx, product in enumerate(products, 1):
    if import_product(product, idx, len(products)):
        stats['success'] += 1
    else:
        stats['failed'] += 1
    time.sleep(0.5)

print(f"\n✅ Done! Success: {stats['success']}, Failed: {stats['failed']}")
