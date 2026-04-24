import pdfplumber
import re

price_regex = re.compile(r'\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b')

path = "/home/asns/ClimaticPRO/frontend/public/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf"

print("Debugging FTXP 35 N9")
try:
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    row_clean = [str(c).replace('\n', ' ').strip() for c in row if c]
                    row_str = " ".join(row_clean)
                    if "FTXP" in row_str and "35" in row_str:
                        print(f"RAW ROW: {row_clean}")
                        prices = []
                        for cell in row_clean:
                            pm = price_regex.findall(cell)
                            for match in pm:
                                match_clean = match.replace(',', '')
                                try:
                                    val = float(match_clean)
                                    if val > 100:
                                        prices.append(val)
                                except:
                                    pass
                        print(f"PARSED PRICES: {prices}")
except Exception as e:
    print(f"Error: {e}")
