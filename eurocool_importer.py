#!/usr/bin/env python3
import json
import time
import requests
import os
from requests.auth import HTTPBasicAuth
from typing import List, Dict

# Configuration
DATA_FILE = "eurocool_data.json"
DEST_URL = "https://cms.climaticpro.ro"

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
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    keys[key] = value
    return keys

# Load keys
env_keys = load_env_keys()
DEST_CONSUMER_KEY = os.getenv("DEST_CONSUMER_KEY", env_keys.get("DEST_CONSUMER_KEY"))
DEST_CONSUMER_SECRET = os.getenv("DEST_CONSUMER_SECRET", env_keys.get("DEST_CONSUMER_SECRET"))

# Static Mapping as fallback or overwrite
CATEGORY_MAPPING = {
    "Aparate aer conditionat": 15, 
}

class EurocoolImporter:
    # Direct mapping from Scraped Name -> Target WooCommerce Category Name (or Slug/ID logic)
    # This merges duplicates like "Rezidențiale" into "Aer Condiționat Rezidențial"
    CATEGORY_REDIRECTS = {
        "Rezidențiale": "Aer Condiționat Rezidențial",
        "AER CONDITIONAT SPLIT DE PERETE": "Split de Perete",
        "AER CONDITIONAT MULTISPLIT": "Multi-Split",
        "Toate aparatele de aer conditionat": "Aer Condiționat Rezidențial",
        # BTU Categories Redirection
        "Aparate aer conditionat 12000 BTU": "Aer Condiționat Rezidențial",
        "Aparate aer conditionat 18000 BTU": "Aer Condiționat Rezidențial",
        "Aparate aer conditionat 24000 BTU": "Aer Condiționat Rezidențial",
        "Aparate aer conditionat 7000 BTU": "Aer Condiționat Rezidențial",
        "Aparate aer conditionat 9000 BTU": "Aer Condiționat Rezidențial",
        # Multi-Split Redirection
        "Aparate de aer conditionat Multisplit": "Aer Condiționat Rezidențial",
        "Aparate aer conditionat dublusplit cu 2 unitati": "Aer Condiționat Rezidențial",
        "Aparate aer conditionat multisplit cu 3 unitati exterioare": "Aer Condiționat Rezidențial",
        "Multi-Split": "Aer Condiționat Rezidențial", # Ensure nested under residential if simple string matches? No, Multi-Split is a valid subcat.
        # But wait, if product has "Multi-Split", we want it in ID 29.
        # Our hierarchy says Multi-Split is child of Residential.
        # But products sometimes come with just "Multi-Split".
        # If I redirect "Multi-Split" to "Aer conditionat Rezidential", I lose the subcategory specificity?
        # Actually in the Cleanup I moved products FROM "Multi-Split" (duplicate) to ID 29.
        # Let's trust get_or_create to find "Multi-Split" (ID 29).
        
        # Commercial Redirection
        "Aer Conditionat Tip Duct, Tip Caseta, Coloana si pentru Pardoseala": "Aer conditionat comercial",
    }

    # Hierarchy enforcement: Child Category Name -> Parent Category Name
    CATEGORY_HIERARCHY = {
        # Children of Consumabile si Accesorii (ID 518)
        "Elemente montaj aer conditionat": "Consumabile si Accesorii",
        "Console aer conditionat": "Consumabile si Accesorii",
        "Kit Instalare AC": "Consumabile si Accesorii",
        "Teava izolata": "Consumabile si Accesorii",
        "Banda izolatoare PVC": "Consumabile si Accesorii",
        "Banda matisat": "Consumabile si Accesorii",
        "Banda metalica performata pentru montaj (OBO)": "Consumabile si Accesorii",
        "Cablu electric": "Consumabile si Accesorii",
        "Diblu cu surub cui percutie": "Consumabile si Accesorii",
        "Diblu pentru gips carton": "Consumabile si Accesorii",
        "Dibluri si suruburi cap hexagonal": "Consumabile si Accesorii",
        "Furtun condens aer conditionat (Dren)": "Consumabile si Accesorii",
        "Holendere": "Consumabile si Accesorii",
        "Izolatie cauciucata": "Consumabile si Accesorii",
        "Suport unitate exterioara aer conditionat": "Consumabile si Accesorii",
        "Suruburi metrice": "Consumabile si Accesorii",
        "Tije filetate": "Consumabile si Accesorii",
        
        # Commercial AC Children
        "Aer Conditionat Tip Duct": "Aer conditionat comercial",
        "Aer Conditionat Tip Caseta": "Aer conditionat comercial",
        "Aer Conditionat Tip Coloana": "Aer conditionat comercial",
        "Aer Conditionat Tip Pardoseala": "Aer conditionat comercial",
        "Duct": "Aer conditionat comercial", # Alias
        "Caseta": "Aer conditionat comercial", # Alias
        
        # Children of Unelte (ID 519)
        "Scule si unelte HVAC": "Unelte",
    }

    def __init__(self):
        if not DEST_CONSUMER_KEY or not DEST_CONSUMER_SECRET:
            raise ValueError("API Keys not found. Please ensure .env file exists with DEST_CONSUMER_KEY and DEST_CONSUMER_SECRET.")
            
        self.auth = HTTPBasicAuth(DEST_CONSUMER_KEY, DEST_CONSUMER_SECRET)
        self.category_map = self._fetch_categories()
        self.existing_skus = self._fetch_existing_skus()
        
        # Enforce hierarchy once at startup
        self._enforce_hierarchy()

    def _enforce_hierarchy(self):
        """Update parent IDs for known categories if they are incorrect"""
        print("Enforcing category hierarchy...")
        for child_name, parent_name in self.CATEGORY_HIERARCHY.items():
            child_id = self.category_map.get(child_name)
            parent_id = self.category_map.get(parent_name)
            
            if child_id and parent_id:
                # We can't easily check the current parent without fetching individual cat data, 
                # but we can just try to update it. Optimally we check first, but PUT is safe.
                try:
                    # Creating a lightweight check or just update. 
                    # To save calls, we could fetch full details in _fetch_categories, but let's just do update for now.
                    # Verify if it needs update (optional optimization)
                    # response = requests.get(f"{DEST_URL}/wp-json/wc/v3/products/categories/{child_id}", auth=self.auth)
                    # if response.json().get('parent') == parent_id: continue

                    requests.put(
                        f"{DEST_URL}/wp-json/wc/v3/products/categories/{child_id}",
                        auth=self.auth,
                        json={"parent": parent_id},
                        timeout=10
                    )
                    print(f"Set parent of '{child_name}' to '{parent_name}'")
                except Exception as e:
                    print(f"Failed to set parent for {child_name}: {e}")

    def _fetch_categories(self):
        """Fetch all existing product categories to avoid duplicates"""
        print("Fetching existing categories...")
        categories = {}
        page = 1
        while True:
            try:
                response = requests.get(
                    f"{DEST_URL}/wp-json/wc/v3/products/categories",
                    auth=self.auth,
                    params={"per_page": 100, "page": page, "hide_empty": False},
                    timeout=20
                )
                if response.status_code != 200:
                    break
                data = response.json()
                if not data:
                    break
                
                for cat in data:
                    categories[cat['name']] = cat['id']
                    categories[cat['slug']] = cat['id']
                
                page += 1
            except Exception as e:
                print(f"Error fetching categories: {e}")
                break
        
        print(f"Found {len(categories)} existing categories.")
        return categories

    def _fetch_existing_skus(self):
        """Fetch all products and map SKU to ID for updates"""
        print("Fetching existing products...")
        sku_map = {}
        page = 1
        while True:
            try:
                response = requests.get(
                    f"{DEST_URL}/wp-json/wc/v3/products",
                    auth=self.auth,
                    params={"per_page": 100, "page": page, "status": "publish"}, # Assuming only published
                    timeout=20
                )
                if response.status_code != 200:
                    break
                data = response.json()
                if not data:
                    break
                
                for p in data:
                    if p.get('sku'):
                        sku_map[p['sku']] = p['id']
                
                page += 1
            except Exception as e:
                print(f"Error fetching products: {e}")
                break
                
        print(f"Found {len(sku_map)} existing products with SKUs.")
        return sku_map

    def get_or_create_category(self, cat_name):
        """Find category by name or create it if missing"""
        if not cat_name:
            return None
            
        # 1. Apply Redirects
        if cat_name in self.CATEGORY_REDIRECTS:
            cat_name = self.CATEGORY_REDIRECTS[cat_name]

        # 2. Check cached map
        if cat_name in self.category_map:
            return self.category_map[cat_name]
            
        # 3. Try slug
        slug = cat_name.lower().replace(' ', '-')
        if slug in self.category_map:
            return self.category_map[slug]

        # 4. Create new
        print(f"Creating new category: {cat_name}...")
        try:
            # Check if this new category should have a parent from our hierarchy list
            parent_id = 0
            if cat_name in self.CATEGORY_HIERARCHY:
                p_name = self.CATEGORY_HIERARCHY[cat_name]
                parent_id = self.category_map.get(p_name, 0)

            response = requests.post(
                f"{DEST_URL}/wp-json/wc/v3/products/categories",
                auth=self.auth,
                json={"name": cat_name, "parent": parent_id},
                timeout=30
            )
            if response.status_code == 201:
                new_cat = response.json()
                new_id = new_cat['id']
                self.category_map[cat_name] = new_id
                self.category_map[new_cat['slug']] = new_id
                return new_id
            else:
                print(f"Failed to create category {cat_name}: {response.text}")
                return None
        except Exception as e:
            print(f"Error creating category {cat_name}: {e}")
            return None

    def import_products(self):
        if not os.path.exists(DATA_FILE):
             print(f"Data file {DATA_FILE} not found. Please run scraper first.")
             return

        with open(DATA_FILE, 'r') as f:
            products = json.load(f)
            
        print(f"Loaded {len(products)} products from {DATA_FILE}")
        
        for p in products:
            sku = p.get('sku')
            price_str = p.get('price', '').replace(' lei', '').replace(',', '.').strip()
            
            if not price_str:
                continue
                
            product_data = {
                'name': p['name'],
                'type': 'simple',
                'regular_price': price_str,
                'description': p['description'],
                'short_description': p['short_description'],
                'categories': [],
                'images': [{'src': img} for img in p['images']],
                'attributes': [],
                'stock_status': p.get('stock_status', 'instock'),
                'meta_data': [
                    {
                        'key': 'suppliers_json',
                        'value': json.dumps([{
                            'name': 'Eurocool',
                            'price': price_str,
                            'currency': 'RON',
                            'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
                        }])
                    },
                    # ACF Field 'EuroCool'
                    {
                        'key': 'eurocool', 
                        'value': price_str
                    },
                    {
                        'key': '_eurocool', 
                        'value': 'field_6980e8a358cfc'
                    }
                ]
            }
            
            if sku:
                product_data['sku'] = sku
            
            # Handle Attributes (Brand = Global ID 2)
            attrs = []
            for k, v in p.get('attributes', {}).items():
                # Normalize BTU/h -> BTU
                if isinstance(v, str):
                    v = v.replace('BTU/h', 'BTU').replace('btu/h', 'BTU')

                if k.lower() == 'brand':
                    attrs.append({
                        'id': 2, # pa_brand
                        'options': [v],
                        'visible': True,
                        'variation': False
                    })
                else:
                    attrs.append({
                        'name': k,
                        'visible': True,
                        'options': [v],
                        'variation': False
                    })
            product_data['attributes'] = attrs
                
            # Handle Categories
            for cat in p['categories']:
                cat_id = self.get_or_create_category(cat)
                if cat_id:
                    product_data['categories'].append({'id': cat_id})
            
            # Update or Create
            try:
                if sku and sku in self.existing_skus:
                    pid = self.existing_skus[sku]
                    print(f"Updating {sku} (ID: {pid})...")
                    requests.put(
                        f"{DEST_URL}/wp-json/wc/v3/products/{pid}",
                        auth=self.auth,
                        json=product_data,
                        timeout=30
                    )
                else:
                    print(f"Creating new product: {p['name']}...")
                    response = requests.post(
                        f"{DEST_URL}/wp-json/wc/v3/products",
                        auth=self.auth,
                        json=product_data,
                        timeout=30
                    )
                    if response.status_code == 201:
                       print("Created.")
                       new_id = response.json().get('id')
                       if sku and new_id:
                           self.existing_skus[sku] = new_id
                    else:
                       print(f"Failed: {response.text}")
            except Exception as e:
                print(f"Operation failed: {e}")
            
            time.sleep(0.5)

if __name__ == "__main__":
    try:
        importer = EurocoolImporter()
        importer.import_products()
    except ValueError as ve:
        print(ve)
    except Exception as e:
        print(f"Unexpected error: {e}")
