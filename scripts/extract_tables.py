import pdfplumber
import os
import json

pdf_paths = [
    "/home/asns/ClimaticPRO/frontend/public/Midea-MultiSplit/OFERTA-002736.pdf",
    "/home/asns/ClimaticPRO/frontend/public/Mitsubshi Heavy ATX/OfertaATX.20.7468.pdf"
]

for path in pdf_paths:
    print(f"\n--- TABLES FROM {os.path.basename(path)} ---")
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                if tables:
                    print(f"Page {i+1} Tables:")
                    for table in tables:
                        for row in table:
                            print(row)
    except Exception as e:
        print(f"Error reading {path}: {e}")
