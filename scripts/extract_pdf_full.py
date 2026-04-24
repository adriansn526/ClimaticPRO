import sys
import glob
import subprocess

pdf_files = glob.glob("/home/asns/ClimaticPRO/docs/Furnizori/Daikin/*.pdf")
for f in pdf_files:
    print(f"\n======================\nFILE: {f}\n======================")
    # Using pdftotext to extract first 20 lines
    try:
        out = subprocess.check_output(['pdftotext', '-layout', f, '-'])
        lines = out.decode('utf-8').split('\n')
        for i, line in enumerate(lines[:30]):
            if line.strip():
                print(line)
    except Exception as e:
        print("Error reading", f, e)
