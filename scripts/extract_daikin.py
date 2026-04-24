import sys
import pypdf

def extract_pdf(pdf_path):
    try:
        reader = pypdf.PdfReader(pdf_path)
        print(f"Total Pages: {len(reader.pages)}")
        for i in range(min(5, len(reader.pages))):
            page = reader.pages[i]
            text = page.extract_text()
            print(f"--- PAGE {i+1} ---")
            print(text[:1000]) # Print first 1000 chars of each page
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    extract_pdf(sys.argv[1])
