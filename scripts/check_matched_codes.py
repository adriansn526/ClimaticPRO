import pandas as pd

try:
    df = pd.read_excel('/home/asns/ClimaticPRO/raport_comparare_oferte.xlsx')
    
    # 1. Investigate the Daikin matches specifically to see what "PDF_Code" they actually get
    # Because if PDF_Code is "Model Match: FTXC25E", we need to extract "FTXC25E" and use it as key
    
    matched_df = df[df['Type'] == 'MATCHED']
    print("\n--- Daikin MATCHED details ---")
    for idx, row in matched_df[matched_df['Brand'] == 'Daikin'].head(10).iterrows():
        print(f"Name: {row['DB_Name'][:30]}... | PDF_Code: {row['PDF_Code']:<25} | DB_Price: {row['DB_Price']}")
        
    print("\n--- Midea MATCHED details ---")
    for idx, row in matched_df[matched_df['Brand'] == 'Midea'].head(10).iterrows():
        print(f"Name: {row['DB_Name'][:30]}... | PDF_Code: {row['PDF_Code']:<25} | DB_Price: {row['DB_Price']}")

except Exception as e:
    print(f"Error reading report: {e}")
