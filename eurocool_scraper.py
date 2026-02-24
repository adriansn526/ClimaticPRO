#!/usr/bin/env python3
import os
import sys
import json
import time
import requests
import re
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import argparse

# Constants
BASE_URL = "https://eurocool.ro"
SHOP_URL = "https://eurocool.ro/shop/"
OUTPUT_FILE = "eurocool_data.json"

# Headers to mimic a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# --- USER CONFIGURATION: CATEGORY MAPPING ---
# Format: "Eurocool Category Name": "ClimaticPRO Category ID or Name"
CATEGORY_MAPPING = {
    "Aparate aer conditionat": "Aer Conditionat", 
}
# --------------------------------------------

class EurocoolScraper:
    def __init__(self, limit=None):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.limit = limit
        
    def get_soup(self, url):
        """Fetch URL and return BeautifulSoup object"""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    def crawl_shop(self, max_pages=100):
        """Crawl the shop pagination to find product links"""
        print(f"Starting crawl of {SHOP_URL}...")
        
        product_urls = set()
        
        for page in range(1, max_pages + 1):
            if self.limit and len(product_urls) >= self.limit:
                break
                
            url = SHOP_URL if page == 1 else f"{SHOP_URL}page/{page}/"
            print(f"Scanning page {page}: {url}")
            
            soup = self.get_soup(url)
            if not soup:
                print("Page not found or error, stopping crawl.")
                break
            
            links = soup.find_all('a', href=True)
            new_products = 0
            
            for link in links:
                href = link['href']
                if '/produs/' in href and href.startswith(BASE_URL):
                    if href not in product_urls:
                        product_urls.add(href)
                        new_products += 1
                        if self.limit and len(product_urls) >= self.limit:
                            break
            
            print(f"  Found {new_products} new products on page {page}.")
            
            if new_products == 0:
                print("No new products found, likely end of pagination.")
                break
                
            time.sleep(1)

        print(f"Total unique products found: {len(product_urls)}")
        return list(product_urls)

    def parse_product(self, url):
        """Extract details from a single product page"""
        print(f"Scraping: {url}")
        soup = self.get_soup(url)
        if not soup:
            return None
            
        product = {
            "source_url": url,
            "name": "",
            "sku": "",
            "price": "",
            "regular_price": "",
            "stock_status": "instock",
            "categories": [],
            "description": "",
            "short_description": "",
            "images": [],
            "attributes": {}
        }
        
        # --- STRATEGY 1: GTM Data (Hidden Input) - Most Reliable ---
        gtm_data = None
        gtm_input = soup.find('input', attrs={'name': 'gtm4wp_product_data'})
        if gtm_input and gtm_input.get('value'):
            try:
                gtm_data = json.loads(gtm_input.get('value'))
            except:
                pass

        # 1. Name
        if gtm_data and 'item_name' in gtm_data:
            product['name'] = gtm_data['item_name']
        else:
            h1 = soup.find('h1', class_='product_title')
            if h1:
                product['name'] = h1.get_text(strip=True)
            
        # 2. SKU
        if gtm_data and 'sku' in gtm_data:
            product['sku'] = str(gtm_data['sku'])
        else:
            sku_el = soup.select_one('.sku_wrapper .sku')
            if sku_el:
                product['sku'] = sku_el.get_text(strip=True)

        # 3. Price
        # Try GTM first
        if gtm_data and 'price' in gtm_data:
            try:
                p_val = float(gtm_data['price'])
                # GTM price is usually the current selling price as a float
                product['price'] = f"{p_val:.2f} lei"
                product['regular_price'] = product['price'] # Default
            except:
                pass
        
        # Try HTML if GTM failed or to find regular price
        # Woodmart theme uses .wd-single-price, not always .summary
        price_el = soup.select_one('.wd-single-price .price')
        if not price_el:
             price_el = soup.find('p', class_='price')
             if not price_el:
                 price_el = soup.find('span', class_='price')
        
        if price_el:
            html_price = ""
            html_regular = ""
            
            # Check for sale price
            ins = price_el.find('ins')
            del_tag = price_el.find('del')
            
            if ins:
                html_price = ins.get_text(strip=True)
                if del_tag:
                    html_regular = del_tag.get_text(strip=True)
            else:
                 # If <bdi> exists, use it
                 bdis = price_el.find_all('bdi')
                 if bdis:
                      html_price = bdis[0].get_text(strip=True)
                 else:
                      html_price = price_el.get_text(strip=True)
                 html_regular = html_price
            
            # If GTM didn't give us a price, use HTML
            if not product['price']:
                product['price'] = html_price
            
            # Use HTML for regular price if it shows a discount
            if html_regular and html_regular != html_price:
                product['regular_price'] = html_regular

        # Fallback: Check for JSON data in script tags if price is missing
        if not product['price']:
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'window._googlesitekit.wcdata.products' in script.string:
                    try:
                        match = re.search(r'window\._googlesitekit\.wcdata\.products\s*=\s*(\[.*?\]);', script.string)
                        if match:
                            products_data = json.loads(match.group(1))
                            for p_data in products_data:
                                # Start matching to ensure we don't pick related products
                                match_score = 0
                                if p_data.get('name') == product['name']: match_score += 2
                                if str(p_data.get('id')) in product['source_url']: match_score += 1 # Weak heuristic
                                
                                # If we have only one product in the list, or a strong match
                                if len(products_data) == 1 or match_score > 0:
                                    if 'price' in p_data:
                                        # price is usually in minor units in wcdata
                                        price_val = float(p_data['price'])
                                        if price_val > 1000: # Heuristic for 'bani'
                                            price_val /= 100
                                        product['price'] = f"{price_val:.2f} lei"
                                        product['regular_price'] = product['price']
                                        break
                    except Exception as e:
                        print(f"JSON fallback failed: {e}")
                    break
        
        # 4. Stock
        if gtm_data and 'stockstatus' in gtm_data:
            if gtm_data['stockstatus'] != 'instock':
                product['stock_status'] = 'outofstock'
        else:
            stock_el = soup.select_one('.stock')
            if stock_el:
                stock_text = stock_el.get_text(strip=True).lower()
                if 'out of stock' in stock_text or 'stoc epuizat' in stock_text:
                    product['stock_status'] = 'outofstock'
            
        # 5. Categories
        if gtm_data and 'item_category' in gtm_data:
             product['categories'] = [gtm_data['item_category']]
        else:
            cat_els = soup.select('.posted_in a')
            product['categories'] = [c.get_text(strip=True) for c in cat_els]
        
        # 6. Description
        desc_div = soup.find('div', id='tab-description')
        if desc_div:
            product['description'] = desc_div.decode_contents()
        else:
            desc_div = soup.select_one('.woocommerce-Tabs-panel--description')
            if desc_div:
                product['description'] = desc_div.decode_contents()
            
        # 7. Short Description
        short_desc_div = soup.select_one('.woocommerce-product-details__short-description')
        if short_desc_div:
            product['short_description'] = short_desc_div.decode_contents()
            
        # 8. Images
        images = []
        gallery_items = soup.select('.woocommerce-product-gallery__image')
        for item in gallery_items:
            a_tag = item.find('a')
            if a_tag and a_tag.get('href'):
                if a_tag.get('href') not in images:
                    images.append(a_tag.get('href'))
            else:
                 img = item.find('img')
                 if img and img.get('src'):
                     if img.get('src') not in images:
                         images.append(img.get('src'))
        if not images:
            og_img = soup.find('meta', property='og:image')
            if og_img and og_img.get('content'):
                images.append(og_img.get('content'))

        product['images'] = images
        
        # 9. Attributes (Specifications)
        attr_table = soup.find('table', class_='woocommerce-product-attributes')
        if attr_table:
            rows = attr_table.find_all('tr')
            for row in rows:
                th = row.find('th')
                td = row.find('td')
                if th and td:
                    key = th.get_text(strip=True)
                    val = td.get_text(strip=True)
                    product['attributes'][key] = val
                    
        return product

    def run(self):
        urls = self.crawl_shop()
        print(f"Found {len(urls)} products to scrape.")
        
        scraped_data = []
        for i, url in enumerate(urls):
            print(f"[{i+1}/{len(urls)}] Processing...")
            try:
                data = self.parse_product(url)
                if data:
                    scraped_data.append(data)
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")
                import traceback
                traceback.print_exc()
            
            time.sleep(0.5)
            
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(scraped_data, f, indent=2, ensure_ascii=False)
            
        print(f"Done! Saved {len(scraped_data)} products to {OUTPUT_FILE}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scrape Eurocool.ro')
    parser.add_argument('--limit', type=int, help='Limit number of products to scrape (for testing)')
    args = parser.parse_args()
    
    scraper = EurocoolScraper(limit=args.limit)
    scraper.run()
