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
URL = "https://cms.climaticpro.ro/wp-json/wc/v3/products"

# Find the Spray product
res = requests.get(URL, auth=HTTPBasicAuth(KEY, SECRET), params={"sku": "EC637", "per_page": 1})
products = res.json()

if products:
    p = products[0]
    print(f"Product ID: {p['id']}")
    print(f"Name: {p['name']}")
    print(f"Categories: {json.dumps(p['categories'], indent=2)}")
    print(f"Attributes: {json.dumps(p['attributes'], indent=2)}")
    print(f"MetaData: {json.dumps(p['meta_data'], indent=2)}")
else:
    print("Product not found.")
