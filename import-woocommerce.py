#!/usr/bin/env python3
"""
Script pentru import complet WooCommerce de la climaticpro.ro la cms.climaticpro.ro
Include: categorii, atribute, tag-uri, produse, imagini, variații
"""

import requests
from requests.auth import HTTPBasicAuth
import json
import time
from typing import List, Dict, Any

# Configurare sursa (site vechi)
SOURCE_URL = "https://climaticpro.ro"
SOURCE_CONSUMER_KEY = "ck_fcb96bd1e295523361bc242b886cc901c514f288"
SOURCE_CONSUMER_SECRET = "cs_b1719d8ac6bf391b6d6ae1fd9abedf826a55f5a5"

# Configurare destinație (site nou)
DEST_URL = "https://cms.climaticpro.ro"
DEST_CONSUMER_KEY = "ck_6e3eef12ca191def4c8c933dfa5a6d5b658189b1"
DEST_CONSUMER_SECRET = "cs_0ce184308506a19a94ce12553c573d3f31105e4b"

class WooCommerceImporter:
    def __init__(self):
        self.source_auth = HTTPBasicAuth(SOURCE_CONSUMER_KEY, SOURCE_CONSUMER_SECRET)
        self.dest_auth = HTTPBasicAuth(DEST_CONSUMER_KEY, DEST_CONSUMER_SECRET) if DEST_CONSUMER_KEY else None
        
        # Mapări ID-uri vechi -> noi
        self.category_map = {}
        self.attribute_map = {}
        self.tag_map = {}
        self.product_map = {}
        
    def get_all_items(self, url: str, auth: HTTPBasicAuth, endpoint: str) -> List[Dict]:
        """Obține toate item-urile dintr-un endpoint cu paginare"""
        items = []
        page = 1
        per_page = 100
        
        while True:
            response = requests.get(
                f"{url}/wp-json/wc/v3/{endpoint}",
                auth=auth,
                params={"per_page": per_page, "page": page}
            )
            
            if response.status_code != 200:
                print(f"❌ Error fetching {endpoint} page {page}: {response.status_code}")
                break
                
            data = response.json()
            if not data:
                break
                
            items.extend(data)
            print(f"📦 Fetched {len(data)} {endpoint} from page {page}")
            
            # Check if there are more pages
            if len(data) < per_page:
                break
                
            page += 1
            time.sleep(0.5)  # Rate limiting
            
        return items
    
    def export_categories(self) -> List[Dict]:
        """Export categorii produse"""
        print("\n🏷️  Exporting product categories...")
        categories = self.get_all_items(SOURCE_URL, self.source_auth, "products/categories")
        
        # Salvare în fișier
        with open('/home/asns/projects/climaticpro/export/categories.json', 'w', encoding='utf-8') as f:
            json.dump(categories, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(categories)} categories")
        return categories
    
    def export_attributes(self) -> List[Dict]:
        """Export atribute produse"""
        print("\n🎨 Exporting product attributes...")
        attributes = self.get_all_items(SOURCE_URL, self.source_auth, "products/attributes")
        
        # Pentru fiecare atribut, obține și termenii
        for attr in attributes:
            attr_id = attr['id']
            terms = self.get_all_items(SOURCE_URL, self.source_auth, f"products/attributes/{attr_id}/terms")
            attr['terms'] = terms
            print(f"  📌 Attribute '{attr['name']}': {len(terms)} terms")
        
        # Salvare în fișier
        with open('/home/asns/projects/climaticpro/export/attributes.json', 'w', encoding='utf-8') as f:
            json.dump(attributes, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(attributes)} attributes")
        return attributes
    
    def export_tags(self) -> List[Dict]:
        """Export tag-uri produse"""
        print("\n🏷️  Exporting product tags...")
        tags = self.get_all_items(SOURCE_URL, self.source_auth, "products/tags")
        
        # Salvare în fișier
        with open('/home/asns/projects/climaticpro/export/tags.json', 'w', encoding='utf-8') as f:
            json.dump(tags, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(tags)} tags")
        return tags
    
    def export_products(self) -> List[Dict]:
        """Export produse complete"""
        print("\n📦 Exporting products...")
        products = self.get_all_items(SOURCE_URL, self.source_auth, "products")
        
        # Salvare în fișier
        with open('/home/asns/projects/climaticpro/export/products.json', 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(products)} products")
        
        # Statistici
        simple = sum(1 for p in products if p['type'] == 'simple')
        variable = sum(1 for p in products if p['type'] == 'variable')
        print(f"  📊 Simple: {simple}, Variable: {variable}")
        
        return products
    
    def export_all(self):
        """Export complet toate datele WooCommerce"""
        import os
        os.makedirs('/home/asns/projects/climaticpro/export', exist_ok=True)
        
        print("🚀 Starting WooCommerce export from climaticpro.ro...")
        print(f"📍 Source: {SOURCE_URL}")
        print("=" * 60)
        
        # Export în ordine (categorii -> atribute -> tags -> produse)
        categories = self.export_categories()
        attributes = self.export_attributes()
        tags = self.export_tags()
        products = self.export_products()
        
        # Rezumat
        print("\n" + "=" * 60)
        print("✅ Export complete!")
        print(f"📊 Summary:")
        print(f"  - Categories: {len(categories)}")
        print(f"  - Attributes: {len(attributes)}")
        print(f"  - Tags: {len(tags)}")
        print(f"  - Products: {len(products)}")
        print(f"\n💾 Files saved in: /home/asns/projects/climaticpro/export/")
        
        return {
            'categories': categories,
            'attributes': attributes,
            'tags': tags,
            'products': products
        }
    
    def import_categories(self, categories: List[Dict]):
        """Import categorii în WordPress nou"""
        if not self.dest_auth:
            print("⚠️  Destination credentials not set. Skipping import.")
            return
            
        print("\n🏷️  Importing categories...")
        
        for cat in categories:
            # Pregătire date pentru import
            cat_data = {
                'name': cat['name'],
                'slug': cat['slug'],
                'description': cat.get('description', ''),
                'display': cat.get('display', 'default'),
                'image': cat.get('image'),
                'menu_order': cat.get('menu_order', 0),
            }
            
            # Dacă are parent, folosește ID-ul mapuit
            if cat.get('parent'):
                cat_data['parent'] = self.category_map.get(cat['parent'], 0)
            
            # Import
            response = requests.post(
                f"{DEST_URL}/wp-json/wc/v3/products/categories",
                auth=self.dest_auth,
                json=cat_data
            )
            
            if response.status_code == 201:
                new_cat = response.json()
                self.category_map[cat['id']] = new_cat['id']
                print(f"  ✅ {cat['name']} (ID: {cat['id']} -> {new_cat['id']})")
            else:
                print(f"  ❌ Failed to import {cat['name']}: {response.status_code}")
            
            time.sleep(0.3)

    def import_tags(self, tags: List[Dict]):
        """Import tag-uri în WordPress nou"""
        if not self.dest_auth:
            print("⚠️  Destination credentials not set. Skipping import.")
            return
            
        print("\n🏷️  Importing tags...")
        
        for tag in tags:
            tag_data = {
                'name': tag['name'],
                'slug': tag['slug'],
                'description': tag.get('description', ''),
            }
            
            response = requests.post(
                f"{DEST_URL}/wp-json/wc/v3/products/tags",
                auth=self.dest_auth,
                json=tag_data
            )
            
            if response.status_code == 201:
                new_tag = response.json()
                self.tag_map[tag['id']] = new_tag['id']
                print(f"  ✅ {tag['name']} (ID: {tag['id']} -> {new_tag['id']})")
            else:
                print(f"  ❌ Failed to import {tag['name']}: {response.status_code}")
            
            time.sleep(0.3)
    
    def import_attributes(self, attributes: List[Dict]):
        """Import atribute și termeni în WordPress nou"""
        if not self.dest_auth:
            print("⚠️  Destination credentials not set. Skipping import.")
            return
            
        print("\n🎨 Importing attributes...")
        
        for attr in attributes:
            # Import atribut
            attr_data = {
                'name': attr['name'],
                'slug': attr['slug'],
                'type': attr.get('type', 'select'),
                'order_by': attr.get('order_by', 'menu_order'),
                'has_archives': attr.get('has_archives', False),
            }
            
            response = requests.post(
                f"{DEST_URL}/wp-json/wc/v3/products/attributes",
                auth=self.dest_auth,
                json=attr_data
            )
            
            if response.status_code == 201:
                new_attr = response.json()
                self.attribute_map[attr['id']] = new_attr['id']
                print(f"  ✅ {attr['name']} (ID: {attr['id']} -> {new_attr['id']})")
                
                # Import termeni pentru acest atribut
                if 'terms' in attr and attr['terms']:
                    for term in attr['terms']:
                        term_data = {
                            'name': term['name'],
                            'slug': term['slug'],
                            'description': term.get('description', ''),
                            'menu_order': term.get('menu_order', 0),
                        }
                        
                        term_response = requests.post(
                            f"{DEST_URL}/wp-json/wc/v3/products/attributes/{new_attr['id']}/terms",
                            auth=self.dest_auth,
                            json=term_data
                        )
                        
                        if term_response.status_code == 201:
                            print(f"    ✅ Term: {term['name']}")
                        elif term_response.status_code == 400:
                            error_data = term_response.json()
                            if 'resource_already_exists' in error_data.get('code', ''):
                                print(f"    ⚠️  Term '{term['name']}' already exists")
                            else:
                                print(f"    ⚠️  Term '{term['name']}': {error_data.get('message', 'validation error')[:50]}")
                        else:
                            print(f"    ❌ Failed term: {term['name']}")
                        
                        time.sleep(0.2)
            else:
                print(f"  ❌ Failed to import {attr['name']}: {response.status_code}")
            
            time.sleep(0.3)
    
    def import_products(self, products: List[Dict]):
        """Import produse în WordPress nou"""
        if not self.dest_auth:
            print("⚠️  Destination credentials not set. Skipping import.")
            return
            
        print("\n📦 Importing products...")
        
        for idx, product in enumerate(products, 1):
            # Pregătire date produs
            product_data = {
                'name': product['name'],
                'slug': product['slug'],
                'type': product['type'],
                'status': product['status'],
                'featured': product.get('featured', False),
                'catalog_visibility': product.get('catalog_visibility', 'visible'),
                'description': product.get('description', ''),
                'short_description': product.get('short_description', ''),
                'sku': product.get('sku', ''),
                'price': product.get('price', ''),
                'regular_price': product.get('regular_price', ''),
                'sale_price': product.get('sale_price', ''),
                'manage_stock': product.get('manage_stock', False),
                'stock_quantity': product.get('stock_quantity'),
                'stock_status': product.get('stock_status', 'instock'),
                'weight': product.get('weight', ''),
                'dimensions': product.get('dimensions', {}),
                'shipping_class': product.get('shipping_class', ''),
                'reviews_allowed': product.get('reviews_allowed', True),
                'meta_data': product.get('meta_data', []),
            }
            
            # Mapare categorii
            if product.get('categories'):
                product_data['categories'] = [
                    {'id': self.category_map.get(cat['id'], cat['id'])}
                    for cat in product['categories']
                ]
            
            # Mapare tag-uri
            if product.get('tags'):
                product_data['tags'] = [
                    {'id': self.tag_map.get(tag['id'], tag['id'])}
                    for tag in product['tags']
                ]
            
            # Imagini
            if product.get('images'):
                product_data['images'] = product['images']
            
            # Atribute
            if product.get('attributes'):
                product_data['attributes'] = product['attributes']
            
            # Import produs
            response = requests.post(
                f"{DEST_URL}/wp-json/wc/v3/products",
                auth=self.dest_auth,
                json=product_data
            )
            
            if response.status_code == 201:
                new_product = response.json()
                self.product_map[product['id']] = new_product['id']
                print(f"  ✅ [{idx}/{len(products)}] {product['name']} (ID: {product['id']} -> {new_product['id']})")
            else:
                print(f"  ❌ [{idx}/{len(products)}] Failed: {product['name']} - {response.status_code}")
                if response.status_code != 201:
                    print(f"     Error: {response.text[:200]}")
            
            time.sleep(0.5)
    
    def import_all(self):
        """Import complet toate datele WooCommerce"""
        import os
        
        print("🚀 Starting WooCommerce import to cms.climaticpro.ro...")
        print(f"📍 Destination: {DEST_URL}")
        print("=" * 60)
        
        # Încărcare date din fișiere
        with open('/home/asns/projects/climaticpro/export/categories.json', 'r') as f:
            categories = json.load(f)
        
        with open('/home/asns/projects/climaticpro/export/attributes.json', 'r') as f:
            attributes = json.load(f)
        
        with open('/home/asns/projects/climaticpro/export/tags.json', 'r') as f:
            tags = json.load(f)
        
        with open('/home/asns/projects/climaticpro/export/products.json', 'r') as f:
            products = json.load(f)
        
        # Import în ordine (categorii -> atribute -> tags -> produse)
        self.import_categories(categories)
        self.import_attributes(attributes)
        self.import_tags(tags)
        self.import_products(products)
        
        # Rezumat
        print("\n" + "=" * 60)
        print("✅ Import complete!")
        print(f"📊 Summary:")
        print(f"  - Categories: {len(self.category_map)}/{len(categories)}")
        print(f"  - Attributes: {len(self.attribute_map)}/{len(attributes)}")
        print(f"  - Tags: {len(self.tag_map)}/{len(tags)}")
        print(f"  - Products: {len(self.product_map)}/{len(products)}")

if __name__ == "__main__":
    import sys
    
    importer = WooCommerceImporter()
    
    # Verificare dacă avem credențiale pentru destinație
    if not DEST_CONSUMER_KEY or not DEST_CONSUMER_SECRET:
        print("⚠️  Destination API keys not configured!")
        print("Please update DEST_CONSUMER_KEY and DEST_CONSUMER_SECRET in the script.")
        sys.exit(1)
    
    # Verificare argument
    if len(sys.argv) > 1 and sys.argv[1] == "import":
        # Import din fișiere existente
        importer.import_all()
    else:
        # Export + Import complet
        print("📥 Step 1: Exporting from source...")
        importer.export_all()
        
        print("\n" + "=" * 60)
        input("Press Enter to continue with import...")
        
        print("\n📤 Step 2: Importing to destination...")
        importer.import_all()
