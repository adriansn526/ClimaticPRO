import pdfplumber
import re

test_files = [
    "/home/asns/ClimaticPRO/frontend/public/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf",
    "/home/asns/ClimaticPRO/frontend/public/Midea-MultiSplit/OFERTA-002736.pdf",
    "/home/asns/ClimaticPRO/frontend/public/Mitsubshi Heavy ATX/OfertaATX.20.7468.pdf"
]

# Stricter SKU Regex: Must have at least one digit AND at least one uppercase letter, length >= 5
# No plain words allowed.
def is_valid_sku(text):
    text = text.strip()
    if len(text) < 5: return False
    # Needs at least 1 digit and 1 letter
    if not any(c.isdigit() for c in text): return False
    if not any(c.isalpha() for c in text): return False
    # Reject things with lowercase letters if we expect upper (though some might have 'v1' etc)
    # Let's just strip 'v1' or similar
    text_up = text.upper()
    return True

price_regex = re.compile(r'\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b')

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
                        
                        # Find potential SKUs
                        skus = []
                        prices = []
                        
                        # A common pattern: SKUs are in the first few columns, prices at the end
                        for cell in row_clean:
                            # Extract words that look like SKUs inside the cell
                            words = cell.split()
                            for w in words:
                                if is_valid_sku(w):
                                    skus.append(w)
                            
                            # Extract prices (ignoring obvious non-prices or small quantities like "1", "2")
                            # We look for something that has a comma/dot and is a bit larger
                            m = price_regex.findall(cell)
                            for match in m:
                                # Clean matching string
                                match_clean = match.replace(',', '')
                                try:
                                    val = float(match_clean)
                                    if val > 100: # Assuming AC parts/units > 100 ron/eur
                                        prices.append(val)
                                except:
                                    pass
                        if skus and prices:
                            print(f"Row Match -> SKUs: {skus} | Prices: {prices}")
                            
    except Exception as e:
        print(f"Error: {e}")
