import fitz  # PyMuPDF
import os

pdf_paths = [
    "/home/asns/ClimaticPRO/frontend/public/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf",
    "/home/asns/ClimaticPRO/frontend/public/Midea-MultiSplit/OFERTA-002736.pdf",
    "/home/asns/ClimaticPRO/frontend/public/Mitsubshi Heavy ATX/OfertaATX.20.7468.pdf"
]

for path in pdf_paths:
    print(f"\n--- SAMPLE FROM {os.path.basename(path)} ---")
    try:
        doc = fitz.open(path)
        page = doc[0]  # First page
        text = page.get_text()
        print(text[:2000])  # Print first 2000 characters
        doc.close()
    except Exception as e:
        print(f"Error reading {path}: {e}")
