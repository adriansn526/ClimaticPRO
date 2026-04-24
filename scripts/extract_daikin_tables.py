import pdfplumber
import os

pdf_path = "/home/asns/ClimaticPRO/frontend/public/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf"

print(f"\n--- TABLES FROM {os.path.basename(pdf_path)} ---")
try:
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            if i > 5: break # only first 5 pages
            tables = page.extract_tables()
            if tables:
                print(f"Page {i+1} Tables:")
                for table in tables:
                    for row in table[:3]: # print first 3 rows
                        print(row)
except Exception as e:
    print(f"Error reading {pdf_path}: {e}")
