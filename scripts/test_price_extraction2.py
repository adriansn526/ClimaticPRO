import pdfplumber
import re

test_files = [
    "/home/asns/ClimaticPRO/frontend/public/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf",
    "/home/asns/ClimaticPRO/frontend/public/Midea-MultiSplit/OFERTA-002736.pdf",
    "/home/asns/ClimaticPRO/frontend/public/Mitsubshi Heavy ATX/OfertaATX.20.7468.pdf"
]

# We need to catch: "AG2Dura-18NXD0-I(R)", "FTXA 25 CW", "SCM60ZS-W", "AG2ECO-24NXD0-I(R)"
price_regex = re.compile(r'\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b')

# Regex to catch likely SKUs and Models, allowing spaces and parentheses
# 1. Standard: alphanumeric with dashes/parentheses "AG2Dura-18NXD0-I(R)"
# 2. Daikin specific: string of 3-4 letters, space, digits, space, letters "FTXA 25 CW"
SKU_PATTERN = re.compile(r'\b[A-Za-z0-9][A-Za-z0-9\-\(\)]{4,}\b|\b[A-Z]{3,4}\s\d{2}\s[A-Z0-9]{1,2}\b', re.IGNORECASE)

def normalize_code(text):
    # Remove all spaces, dashes, parentheses to make a contiguous uppercase string
    # "FTXA 25 CW" -> "FTXA25CW"
    # "AG2Dura-18NXD0-I(R)" -> "AG2DURA18NXD0IR"
    return re.sub(r'[^A-Z0-9]', '', str(text).upper())

for path in test_files:
    print(f"\n--- TESTING {path.split('/')[-1]} ---")
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages):
                if i > 2: break
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        row_clean = [str(c).replace('\n', ' ').strip() for c in row if c]
                        if not row_clean: continue
                        
                        skus = []
                        prices = []
                        
                        for cell in row_clean:
                            # Instead of splitting words, findall over the cell
                            matches = SKU_PATTERN.findall(cell)
                            for m in matches:
                                norm = normalize_code(m)
                                # Basic noise filter: must have digit and letter
                                if any(c.isdigit() for c in norm) and any(c.isalpha() for c in norm) and len(norm) >= 5:
                                    skus.append(norm)
                            
                            pm = price_regex.findall(cell)
                            for match in pm:
                                match_clean = match.replace(',', '')
                                try:
                                    val = float(match_clean)
                                    if val > 100:
                                        prices.append(val)
                                except:
                                    pass
                        
                        if skus and prices:
                            max_price = max(prices)
                            print(f"Row Match -> Normalized SKUs: {skus} | Max Price (System Gross): {max_price}")
                            
    except Exception as e:
        print(f"Error: {e}")
