import requests
from requests.auth import HTTPBasicAuth
import os
import json

def load_env_keys(env_path=".env"):
    keys = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    keys[key.strip()] = value.strip().strip('"').strip("'")
    return keys

env = load_env_keys()
KEY = env.get("DEST_CONSUMER_KEY")
SECRET = env.get("DEST_CONSUMER_SECRET")
URL = "https://cms.climaticpro.ro/wp-json/wc/v3/products/categories"

def fetch_all_categories():
    categories = []
    page = 1
    while True:
        res = requests.get(URL, auth=HTTPBasicAuth(KEY, SECRET), params={"per_page": 100, "page": page})
        if res.status_code != 200:
            break
        data = res.json()
        if not data:
            break
        categories.extend(data)
        page += 1
    return categories

def build_tree(categories):
    tree = {}
    # Create mapping of id -> category
    cat_map = {c['id']: c for c in categories}
    
    # Initialize children list for each category
    for c in categories:
        c['children'] = []
    
    # Build tree
    roots = []
    for c in categories:
        parent_id = c['parent']
        if parent_id == 0:
            roots.append(c)
        elif parent_id in cat_map:
            cat_map[parent_id]['children'].append(c)
            
    return roots

def print_tree(nodes, level=0):
    for node in nodes:
        indent = "  " * level
        print(f"{indent}- {node['name']} (ID: {node['id']}, Slug: {node['slug']})")
        if node['children']:
            print_tree(node['children'], level + 1)

print("Fetching categories...")
all_cats = fetch_all_categories()
print(f"Total categories found: {len(all_cats)}")
print("\nCategory Tree:")
tree = build_tree(all_cats)
print_tree(tree)
