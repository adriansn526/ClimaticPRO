import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

sites = [
    'https://www.melindainstal.ro',
    'https://www.frigotehnie.ro',
    'https://aero-shop.ro',
    'https://euro-instal.ro',
    'https://shop.ancopolar.ro',
    'https://evofrost.ro'
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

for site in sites:
    try:
        resp = requests.get(site, headers=headers, verify=False, timeout=15)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        print(f"\n--- {site} ---")
        found = False
        for a in soup.find_all('a', href=True):
            h = a['href'].lower()
            text = a.text.lower()
            if 'aer' in h or 'clima' in h or 'conditionat' in h or 'aer' in text or 'clima' in text:
                if len(a['href']) > 1:
                    print(f"FOUND: {a['href']} (Text: {a.text.strip()})")
                    found = True
        
        if not found:
            print("No obvious AC category links found. Dumping all menu items...")
            for a in list(soup.find_all('a', href=True))[:20]:
                print(f"LINK: {a['href']} ({a.text.strip()})")

    except Exception as e:
        print(f"Error fetching {site}: {e}")
