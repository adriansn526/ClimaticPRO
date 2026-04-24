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

keywords = ['aer', 'clima', 'conditionat', 'split']

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

for url in urls:
    try:
        res = requests.get(url, headers=headers, timeout=10, verify=False)
        soup = BeautifulSoup(res.text, 'html.parser')
        links = soup.find_all('a', href=True)
        
        found = set()
        for a in links:
            text = a.get_text(separator=' ', strip=True).lower()
            href = a['href']
            
            # Simple check if keyword is in the link text or URL
            for kw in keywords:
                if kw in text or kw in href.lower():
                    if href.startswith('/'):
                        href = url.rstrip('/') + href
                    if href.startswith('http'):
                        found.add((text, href))
                        break
                        
        print(f"--- Links for {url} ---")
        for text, href in found:
            print(f"- {text[:30]}: {href}")
    except Exception as e:
        print(f"Failed {url}: {e}")
