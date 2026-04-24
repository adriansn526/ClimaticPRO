import pandas as pd

try:
    df = pd.read_excel('/home/asns/ClimaticPRO/raport_comparare_oferte.xlsx')
    
    print(f"Total rows: {len(df)}")
    print(f"Counts by Type:\n{df['Type'].value_counts()}\n")
    
    print("--- 15 Examples of MISSING_IN_DB (What did we extract?) ---")
    missing_df = df[df['Type'] == 'MISSING_IN_DB']
    for idx, row in missing_df.head(15).iterrows():
        print(f"[{row['Brand']}] PDF_Code: {row['PDF_Code']:<20} | Price: {row['PDF_Price']}")
        
    print("\n--- 10 Examples of MATCHED (Did we get the price?) ---")
    matched_df = df[df['Type'] == 'MATCHED']
    for idx, row in matched_df.head(10).iterrows():
        print(f"[{row['Brand']}] DB_SKU: {row['DB_SKU']:<15} | PDF_Price: {row['PDF_Price']} | DB_Price: {row['DB_Price']}")
        
    # Check for empty or garbage codes
    garbage = missing_df[missing_df['PDF_Code'].str.len() < 5]
    if not garbage.empty:
        print(f"\nFound {len(garbage)} potentially garbage codes (length < 5)")
        print(garbage['PDF_Code'].head())

except Exception as e:
    print(f"Error reading report: {e}")
