import os
import re
import pandas as pd
import pdfplumber
from woocommerce import API

# --- CONFIGURATION ---
WC_URL = "https://cms.climaticpro.ro"
WC_KEY = "ck_276305bd4bca6a6ae264d5a9faf12a4a"
WC_SECRET = "cs_851a8cf0c7facf0f215891f96949d79d"

DIRECTORIES = {
    "Daikin": "/home/asns/ClimaticPRO/frontend/public/Daikin",
    "Midea": "/home/asns/ClimaticPRO/frontend/public/Midea-MultiSplit",
    "Mitsubishi": "/home/asns/ClimaticPRO/frontend/public/Mitsubshi Heavy ATX"
}

# Regex to catch likely SKUs and Models: e.g. AMBG36097400CN, SCM60ZS-W, FTXF 20 F
SKU_PATTERN = re.compile(r'\b[A-Za-z0-9][A-Za-z0-9\-\(\)]{4,}\b|\b[A-Z]{3,4}\s\d{2}\s[A-Z0-9]{1,2}\b', re.IGNORECASE)

def fetch_woo_products():
    print("Loading products from local JSON...")
    import json
    with open("/home/asns/ClimaticPRO/products.json", "r") as f:
        products = json.load(f)
        
    all_products = []
    for p in products:
        all_products.append({
            "id": p["id"],
            "name": p["name"],
            "sku": str(p.get("sku", "")).strip().upper(),
            "price": p.get("price", ""),
            "status": "publish"
        })
    return pd.DataFrame(all_products)

def normalize_code(text):
    return re.sub(r'[^A-Z0-9]', '', str(text).upper())

def is_valid_sku(text):
    text = text.strip()
    if len(text) < 5: return False
    if not any(c.isdigit() for c in text): return False
    if not any(c.isalpha() for c in text): return False
    return True

price_regex = re.compile(r'\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b')

def extract_pdf_data(directory):
    found_tokens = {} # Map from NORM_SKU -> Price
    raw_texts = []
    
    if not os.path.exists(directory):
        return found_tokens, raw_texts
        
    for filename in os.listdir(directory):
        if not filename.lower().endswith(".pdf"):
            continue
        path = os.path.join(directory, filename)
        print(f"Parsing {filename}...")
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    raw_texts.append(text)
                    
                    # 1. Fallback / Primary: parse raw text lines for prices cut off by table mergers
                    for line in text.split('\n'):
                        skus = []
                        prices = []
                        matches = SKU_PATTERN.findall(line)
                        for m in matches:
                            norm = normalize_code(m)
                            if is_valid_sku(norm):
                                skus.append(norm)
                        
                        pm = price_regex.findall(line)
                        for match in pm:
                            match_clean = match.replace(',', '')
                            try:
                                val = float(match_clean)
                                if val > 100:
                                    prices.append(val)
                            except:
                                pass
                        if skus:
                            max_price = max(prices) if prices else None
                            for s in skus:
                                if s not in found_tokens or found_tokens[s] is None:
                                    found_tokens[s] = max_price
                                elif max_price is not None and max_price > found_tokens[s]:
                                    found_tokens[s] = max_price

                    # 2. Table Parsing
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            row_clean = [str(c).replace('\n', ' ').strip() for c in row if c]
                            if not row_clean: continue
                            
                            skus = []
                            prices = []
                            
                            for cell in row_clean:
                                matches = SKU_PATTERN.findall(cell)
                                for m in matches:
                                    norm = normalize_code(m)
                                    if is_valid_sku(norm):
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
                            
                            if skus:
                                max_price = max(prices) if prices else None
                                for s in skus:
                                    if s not in found_tokens or found_tokens[s] is None:
                                        found_tokens[s] = max_price
                                    elif max_price is not None and max_price > found_tokens[s]:
                                        found_tokens[s] = max_price
                                        
        except Exception as e:
            print(f"  Error parsing {filename}: {e}")
            
    full_text = " \n ".join(raw_texts)
    matches = set(SKU_PATTERN.findall(full_text))
    
    for t in matches:
        norm = normalize_code(t)
        if is_valid_sku(norm) and norm not in found_tokens:
            found_tokens[norm] = None
            
    return found_tokens, full_text

def main():
    df_db = fetch_woo_products()
    print(f"\nTotal products in DB: {len(df_db)}")
    
    report_data = []

    for brand, path in DIRECTORIES.items():
        print(f"\n--- Analyzing {brand} ---")
        pdf_tokens, raw_text = extract_pdf_data(path)
        
        brand_mask = df_db['name'].str.contains(brand, case=False, na=False)
        if brand == "Mitsubishi":
            brand_mask = brand_mask | df_db['name'].str.contains("Heavy", case=False, na=False)
            
        df_brand_db = df_db[brand_mask]
        print(f"Found {len(df_brand_db)} products in DB for {brand}")
        
        matched_skus = set()
        
        # 1. Check all brand products in DB against PDF text
        for _, row in df_brand_db.iterrows():
            sku = row['sku']
            name = row['name'].upper()
            
            is_matched = False
            match_reason = ""
            matched_token = ""
            
            norm_sku = normalize_code(sku)
            
            # Check if Exact SKU is in PDF tokens
            if is_valid_sku(norm_sku) and (norm_sku in pdf_tokens):
                is_matched = True
                match_reason = f"SKU Match: {sku}"
                matched_token = norm_sku
            else:
                name_tokens = re.findall(r'\b[A-Za-z0-9][A-Za-z0-9\-\(\)]{4,}\b', name)
                for nt in name_tokens:
                    norm_nt = normalize_code(nt)
                    
                    # Midea specific logic: DURA vs ECO
                    check_tokens = [norm_nt]
                    if brand == "Midea" and "ECO" in norm_nt:
                        check_tokens.append(norm_nt.replace("ECO", "DURA"))
                        
                    for ct in check_tokens:
                        if is_valid_sku(ct) and ct in pdf_tokens:
                            is_matched = True
                            match_reason = f"Model Match: {nt} -> PDF: {ct}"
                            matched_token = ct
                            break
                    if is_matched:
                        break
                        
            if is_matched:
                matched_skus.add(sku)
                pdf_price = pdf_tokens.get(matched_token, "Nu s-a extras")
                report_data.append({
                    "Brand": brand,
                    "Type": "MATCHED",
                    "DB_Name": row['name'],
                    "DB_SKU": sku,
                    "DB_Price": row['price'],
                    "PDF_Code": match_reason,
                    "PDF_Price": pdf_price if pd.notna(pdf_price) and pdf_price is not None else "Nu s-a extras",
                    "Status": "Exista in DB si in Oferta"
                })
            else:
                report_data.append({
                    "Brand": brand,
                    "Type": "ORPHAN_IN_DB",
                    "DB_Name": row['name'],
                    "DB_SKU": sku,
                    "DB_Price": row['price'],
                    "PDF_Code": "-",
                    "PDF_Price": "-",
                    "Status": "Produs pe site, LIPSA din oferta curenta (PDF)"
                })
                
        # 2. Find Missing in DB: Tokens from PDF that did not match ANY DB product
        # (This is noisy, so we only report likely long SKUs)
        db_all_skus = set(df_db['sku'].tolist())
        db_all_names = " ".join(df_db['name'].tolist()).upper()
        
        for token, pdf_price in pdf_tokens.items():
            if len(token) > 5 and not token.isdigit():
                # If this token is nowhere in the DB SKUs or Names
                if token not in db_all_skus and token not in db_all_names:
                    report_data.append({
                        "Brand": brand,
                        "Type": "MISSING_IN_DB",
                        "DB_Name": "-",
                        "DB_SKU": "-",
                        "DB_Price": "-",
                        "PDF_Code": token,
                        "PDF_Price": pdf_price if pdf_price is not None else "Nu s-a extras",
                        "Status": "Cod / Model gasit in PDF, dar LIPSESTE de pe SITE"
                    })

    df_report = pd.DataFrame(report_data)
    
    # Sort for readability
    if not df_report.empty:
        df_report = df_report.sort_values(by=["Brand", "Type"])
        
    out_file = "/home/asns/ClimaticPRO/raport_comparare_oferte.xlsx"
    df_report.to_excel(out_file, index=False)
    print(f"\nReport generated successfully: {out_file}")
    
if __name__ == "__main__":
    main()
