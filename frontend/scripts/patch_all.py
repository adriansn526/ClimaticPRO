import requests
from bs4 import BeautifulSoup
import urllib3
import json
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

urls = {
    "MelindaInstal": "https://www.melindainstal.ro/",
    "Frigotehnie": "https://www.frigotehnie.ro/",
    "Aero Shop": "https://aero-shop.ro/",
    "Euro-Instal": "https://www.euro-instal.ro/",
    "Ancopolar": "https://shop.ancopolar.ro/",
    "Evofrost": "https://www.evofrost.ro/"
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36'
}

all_data = {}

for name, url in urls.items():
    try:
        res = requests.get(url, headers=headers, timeout=10, verify=False)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        links = soup.find_all('a', href=True)
        cats = set()
        for a in links:
            href = a['href']
            # Heuristics for category links
            if "melindainstal.ro" in url:
                if href.startswith('/'):
                    href = "https://www.melindainstal.ro" + href
                if "-wig0" in href and href.count('/') == 3: # main category
                    cats.add(href)
            elif "frigotehnie.ro" in url:
                if "frigotehnie.ro/" in href and "-" in href and not ".html" in href:
                    parts = href.split('/')
                    if len(parts) == 4 and parts[-1][0].isdigit():
                        cats.add(href)
            elif "aero-shop.ro" in url:
                if "categorie-produs/" in href:
                    cats.add(href)
            elif "euro-instal.ro" in url:
                if "-c" in href and "-" in href and href.count('/') <= 4:
                    if href.startswith('http'):
                        cats.add(href)
            elif "ancopolar.ro" in url:
                if "shop.ancopolar.ro/" in href and href.count('/') == 4:
                    if not any(x in href for x in ['contact', 'despre', 'cos', 'blog', 'cont']):
                        cats.add(href)
            elif "evofrost.ro" in url:
                if "evofrost.ro/" in href and href.count('/') == 3:
                     if not any(x in href for x in ['contact', 'despre', 'cos', 'blog', 'cont', 'login', 'register']):
                         cats.add(href)
                     
        all_data[name] = list(cats)
    except Exception as e:
        print(f"Failed {url}: {e}")

# Read the existing ts file and patch
import re
with open('/home/asns/ClimaticPRO/frontend/scripts/update_suppliers.ts', 'r') as f:
    text = f.read()

for name, cat_list in all_data.items():
    if not cat_list: continue
    
    # regex to find the catalogUrls block for this specific name
    # We will just do a simpler search/replace manually using AST or simple string if possible
    # We'll generate a fresh clean TS file for safety!
    
# Generate a new complete script to avoid regex malformations
ts_code = """import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updates = [
  {
    name: 'MelindaInstal',
    config: {
      catalogUrls: """ + json.dumps(all_data.get('MelindaInstal', [])) + """,
      productLinkSelector: '.category-item li a, .product-item a',
      paginationSelector: 'a.next, .pagination-next',
      priceSelector: '.price, .amount, .product-price',
      titleSelector: 'h1.h1, h1.page-title, h1.product-title, h1',
      stockSelector: '.stock, .availability, .in-stock'
    }
  },
  {
    name: 'Frigotehnie',
    config: {
      catalogUrls: """ + json.dumps(all_data.get('Frigotehnie', [])) + """,
      productLinkSelector: 'article.product-miniature a.product-thumbnail',
      paginationSelector: 'a.next.js-search-link',
      priceSelector: '.current-price span[itemprop="price"]',
      titleSelector: 'h1.h1',
      stockSelector: '#product-availability'
    }
  },
  {
    name: 'Aero Shop',
    config: {
      catalogUrls: """ + json.dumps(all_data.get('Aero Shop', [])) + """,
      productLinkSelector: 'li.product a.woocommerce-LoopProduct-link',
      paginationSelector: 'a.next.page-numbers',
      priceSelector: 'p.price span.woocommerce-Price-amount bdi',
      titleSelector: 'h1.product_title',
      stockSelector: 'p.stock.in-stock'
    }
  },
  {
    name: 'Euro-Instal',
    config: {
      catalogUrls: """ + json.dumps(all_data.get('Euro-Instal', [])) + """,
      productLinkSelector: '.product-layout .image a',
      paginationSelector: 'ul.pagination li a:contains(">")',
      priceSelector: '.price-new, .price',
      titleSelector: 'h1',
      stockSelector: '.stock'
    }
  },
  {
    name: 'Ancopolar',
    config: {
      catalogUrls: """ + json.dumps(all_data.get('Ancopolar', [])) + """,
      productLinkSelector: '.product-wrapper a.product-image-link',
      paginationSelector: 'a.next.page-numbers',
      priceSelector: '.price .woocommerce-Price-amount',
      titleSelector: 'h1.product_title',
      stockSelector: '.stock'
    }
  },
  {
    name: 'Evofrost',
    config: {
      catalogUrls: """ + json.dumps(all_data.get('Evofrost', [])) + """,
      productLinkSelector: '.product-box .title-holder a',
      paginationSelector: 'a.next',
      priceSelector: '.price_box .price, .product-price',
      titleSelector: 'h1',
      stockSelector: '.stock-status, .availability'
    }
  }
];

async function main() {
  for (const supp of updates) {
    const dbSupp = await prisma.supplier.findFirst({ where: { name: supp.name } });
    if (dbSupp) {
      await prisma.supplier.update({
        where: { id: dbSupp.id },
        data: { crawlerConfig: supp.config }
      });
      console.log(`Updated ${supp.name} with ALL categories.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
"""

with open('/home/asns/ClimaticPRO/frontend/scripts/update_suppliers.ts', 'w') as f:
    f.write(ts_code)

print("TS file successfully regenerated with all categories!")
