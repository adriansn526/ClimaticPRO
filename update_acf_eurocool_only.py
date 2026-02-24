
import json
import os
import subprocess
import time
import sys
import re

DATA_FILE = 'eurocool_data.json'
ACF_FIELD_KEY = "field_6980e8a358cfc" # Found via wp post list --post_type=acf-field
META_KEY = "eurocool"


def run_wp_cli(args):
    """Run a WP-CLI command inside the docker container."""
    # Do not auto-append --format=json or --user=admin to everything, 
    # but we need --user=admin for permissions usually.
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar"] + args 
    if "--user=admin" not in args:
        cmd.append("--user=admin")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # print(f"DEBUG CMD: {cmd}")
    
    try:
        stdout = result.stdout.strip()
        if not stdout: return None
        
        # Robust JSON extraction if needed (for list commands)
        if "--format=json" in args:
             match = re.search(r'(\[\s*\{|\{\s*")', stdout)
             if match:
                  json_str = stdout[match.start():]
                  return json.loads(json_str)
        
        return stdout 
    except:
        return None

def get_product_id_by_sku(sku):
    res = run_wp_cli(["wc", "product", "list", f"--sku={sku}", "--fields=id", "--format=json"])
    if res and isinstance(res, list) and len(res) > 0:
        return res[0]['id']
    return None

def update_acf_data(product_id, eurocool_price):
    # CRITICAL: Delete existing keys first to ensure Casing is reset to lowercase 'eurocool'
    # WP DB collation makes lookup case-insensitive, so updating 'eurocool' might just update 'EuroCool'.
    # Deleting forces the next update to create a NEW key with correct casing.
    run_wp_cli(["post", "meta", "delete", str(product_id), "EuroCool"])
    run_wp_cli(["post", "meta", "delete", str(product_id), "_EuroCool"])

    # 1. Update the Value
    run_wp_cli(["post", "meta", "update", str(product_id), META_KEY, str(eurocool_price)])
    
    # 2. Update the Reference Key (Critical for ACF visibility)
    run_wp_cli(["post", "meta", "update", str(product_id), "_" + META_KEY, ACF_FIELD_KEY])
    
    print(f"Updated ID {product_id}: {META_KEY}={eurocool_price} (Ref: {ACF_FIELD_KEY})")

def main():
    print("Loading data...")
    if not os.path.exists(DATA_FILE):
        print(f"File {DATA_FILE} not found.")
        return

    with open(DATA_FILE, 'r') as f:
        products = json.load(f)

    print(f"Found {len(products)} products in source.")
    
    count_updated = 0
    count_missing = 0
    
    for p in products:
        sku = p.get('sku')
        if not sku: continue
        
        # Clean price (Eurocool raw price)
        price_raw = p.get('price', '').replace(' lei', '').replace(',', '.').strip()
        
        if not price_raw:
            continue
            
        pid = get_product_id_by_sku(sku)
        if pid:
            update_acf_data(pid, price_raw)
            count_updated += 1
        else:
            # print(f"SKU {sku} not found.")
            count_missing += 1

    print(f"\nDone. Updated {count_updated} products. Skipped {count_missing} (SKU not found).")

if __name__ == "__main__":
    main()
