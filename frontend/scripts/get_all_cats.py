import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

urls = [
    "https://www.melindainstal.ro/",
    "https://www.frigotehnie.ro/",
    "https://aero-shop.ro/",
    "https://www.euro-instal.ro/",
    "https://shop.ancopolar.ro/",
    "https://www.evofrost.ro/"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36'
}

for url in urls:
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
                     cats.add(href)
                     
        print(f"\n--- {url} ({len(cats)} categories) ---")
        for c in sorted(list(cats))[:25]: # limit print to 25 to avoid giant output
            print(f"'{c}',")
    except Exception as e:
        print(f"Failed {url}: {e}")
