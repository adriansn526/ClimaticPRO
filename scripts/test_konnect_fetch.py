import requests
import re
from bs4 import BeautifulSoup

url = "https://konnect-shop.ro/aer-conditionat-gree-gwh12aab-k6dna4a-bora-a4-silver-12000-btu-cu-kit-instalare-inclus"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept-Language': 'en-US,en;q=0.9,ro;q=0.8'
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Try common price selectors
    prices = soup.select('.price, .product-price, [itemprop="price"], span.woocommerce-Price-amount,bdi')
    print("Found prices in HTML:")
    for p in prices:
        print(f"- {p.text.strip()}")
        
    # Check title
    title = soup.select_one('h1')
    print(f"Title: {title.text.strip() if title else 'None'}")
else:
    print(f"Failed to fetch {url}, status code {response.status_code}")
