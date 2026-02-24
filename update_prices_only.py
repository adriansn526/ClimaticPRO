
import json
import time
import requests
import os
from typing import List, Dict

# Configuration
DATA_FILE = "eurocool_data.json"
WP_API_URL = "https://cms.climaticpro.ro" # Internal docker usage might differ, allows localhost? 
# Use the same env loading as importer for keys
import subprocess

def load_env_keys(env_path=".env"):
    """Simple parser for .env file with format KEY = 'VALUE' or KEY=VALUE"""
    keys = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    keys[k] = v
    return keys

keys = load_env_keys()
CK = keys.get("WOOCOMMERCE_CONSUMER_KEY")
CS = keys.get("WOOCOMMERCE_CONSUMER_SECRET")

# Keys are not strictly needed for WP-CLI mode, but we keep the loader
# if not CK or not CS:
#    print("Error: credentials not found in .env")
#    exit(1)

import re


def run_wp_cli(args):
    """Run a WP-CLI command inside the docker container."""
    # cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar"] + args + ["--format=json", "--user=admin"]
    # FIX: Do not auto-append --format=json, as 'wc product update' rejects it.
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar"] + args + ["--user=admin"]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # Debug output 
    # print(f"DEBUG CMD: {cmd}")
    # print(f"DEBUG RETURN: {result.returncode}")
    # if result.stderr:
    #    print(f"DEBUG STDERR: {result.stderr}")

    try:
        stdout = result.stdout.strip()
        if not stdout: return None
        
        # Robust JSON extraction: look for start of JSON object/array
        match = re.search(r'(\[\s*\{|\{\s*")', stdout)
        if match:
             json_str = stdout[match.start():]
             return json.loads(json_str)
        
        # Fallback: try raw load if it looks like JSON
        if stdout.startswith('{') or stdout.startswith('['):
            return json.loads(stdout)
            
        return stdout # Return raw string if not JSON (e.g. "Success...")
    except:
        return None

def get_product_id_by_sku(sku):
    # Add --format=json explicitly
    res = run_wp_cli(["wc", "product", "list", f"--sku={sku}", "--fields=id", "--format=json"])
    if res and isinstance(res, list) and len(res) > 0:
        return res[0]['id']
    return None


def apply_markup(price_ron):
    """
    Apply commercial markup based on price thresholds.
    0 - 500 RON: +30%
    500 - 2000 RON: +20%
    2000 - 5000 RON: +15%
    > 5000 RON: +10%
    """
    try:
        price = float(price_ron)
    except ValueError:
        return price_ron # Return as is if parsing fails

    if price <= 500:
        markup = 1.30
    elif price <= 2000:
        markup = 1.20
    elif price <= 5000:
        markup = 1.15
    else:
        markup = 1.10
    
    final_price = price * markup
    # Round to 2 decimal places or nearest integer? usually 2 decimals for web
    return "{:.2f}".format(final_price)

def update_product_data(product_id, eurocool_price, sell_price):
    # Update suppliers_json and EuroCool field with RAW supplier price
    suppliers_data = json.dumps([{
        "name": "Eurocool",
        "price": f"{eurocool_price}",
        "currency": "RON",
        "last_updated": time.strftime('%Y-%m-%d %H:%M:%S')
    }])

    # 1. Update EuroCool ACF & Suppliers Hash (Supplier Price)
    # Using 'post meta update' - returns string success msg, so run_wp_cli returns string or None.
    # CRITICAL: Meta key must be lowercase 'eurocool' to match ACF field name
    run_wp_cli(["post", "meta", "update", str(product_id), "eurocool", str(eurocool_price)])
    # CRITICAL: Update ACF reference key so it shows in Admin (_eurocool -> field_key)
    run_wp_cli(["post", "meta", "update", str(product_id), "_eurocool", "field_6980e8a358cfc"])
    
    run_wp_cli(["post", "meta", "update", str(product_id), "suppliers_json", suppliers_data])
    
    # 2. Update Main Product Price (Sell Price with Markup)
    # We use 'wc product update' for the main price fields to ensure hooks fire if needed (though direct DB is faster)
    # Using wp-cli 'wc product update' is standard.
    # Using wp-cli 'wc product update'. NO --format=json.
    run_wp_cli(["wc", "product", "update", str(product_id), f"--regular_price={sell_price}"])

    print(f"Updated ID {product_id}: Supplier={eurocool_price} RON -> Sell={sell_price} RON")

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
        # Handle thousand separators if any (e.g. 1.200.00)
        # Assuming input is like "1200.00" or simple format from scraper. 
        # Scraper usually returns "1234.56" or "1234". 
        
        if not price_raw:
            continue
            
        pid = get_product_id_by_sku(sku)
        if pid:
            # Calculate Sell Price
            sell_price = apply_markup(price_raw)
            
            update_product_data(pid, price_raw, sell_price)
            count_updated += 1
        else:
            # print(f"SKU {sku} not found.")
            count_missing += 1

    print(f"\nDone. Updated {count_updated} products. Skipped {count_missing} (SKU not found).")

if __name__ == "__main__":
    main()
