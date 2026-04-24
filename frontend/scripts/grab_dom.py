import requests
from bs4 import BeautifulSoup
import os
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

os.makedirs('/home/asns/ClimaticPRO/frontend/scripts/html_dumps', exist_ok=True)

targets = {
    'melinda': 'https://www.melindainstal.ro/cautare?search=aer+conditionat',
    'frigotehnie': 'https://www.frigotehnie.ro/search?controller=search&s=aer',
    'aeroshop': 'https://aero-shop.ro/categorie-produs/aer-conditionat-rezidential/',
    'euroinstal': 'https://www.euro-instal.ro/aer-conditionat-c187',
    'ancopolar': 'https://shop.ancopolar.ro/aer-conditionat/',
    'evofrost': 'https://www.evofrost.ro/aer-conditionat'
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0',
    'Accept-Language': 'en-US,en;q=0.5'
}

for name, url in targets.items():
    try:
        r = requests.get(url, headers=headers, verify=False, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')

        snippet = ""
        products = soup.select('div[class*="product"], div[class*="item"], li[class*="product"]')
        
        found = 0
        for p in products:
            if found >= 2: break
            if p.find('a') and (p.find(string=lambda t: t and ('lei' in t.lower() or 'ron' in t.lower())) or p.find(class_=lambda c: c and 'price' in c.lower())):
                snippet += f"--- {name} PRODUCT SNIPPET ---\n"
                snippet += p.prettify()[:1500] + '\n\n'
                found += 1
        
        with open(f'/home/asns/ClimaticPRO/frontend/scripts/html_dumps/{name}.txt', 'w') as f:
            f.write(snippet if snippet else f"NO PRODUCTS FOUND. HTML SNAPSHOT:\n{r.text[:2000]}")
        print(f"Dumped {name}. Found: {found}")
    except Exception as e:
        print(f"Failed {name}: {e}")
