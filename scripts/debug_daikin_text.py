import pdfplumber

path = "/home/asns/ClimaticPRO/frontend/public/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf"

print("Debugging RAW TEXT for FTXP 35 N9")
try:
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text and "FTXP 35 N9" in text:
                lines = text.split('\n')
                for line in lines:
                    if "FTXP" in line or "RXP" in line:
                        print(line)
except Exception as e:
    print(f"Error: {e}")
