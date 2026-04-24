import json
import pandas as pd
import re
import os

# Paths
INPUT_JSON = "/home/asns/ClimaticPRO/customers.json"
OUTPUT_CSV = "/home/asns/ClimaticPRO/campanie_sms_primavara.csv"

def clean_phone_number(phone):
    if not phone:
        return None
        
    # Remove all non-digit characters
    cleaned = re.sub(r'\D', '', str(phone))
    
    # Romanian numbering logic for SMS (we want to ensure +40)
    if cleaned.startswith('40') and len(cleaned) == 11:
        return '+' + cleaned
    elif cleaned.startswith('07') and len(cleaned) == 10:
        return '+40' + cleaned[1:]
    elif len(cleaned) == 9 and cleaned.startswith('7'): # Rarely missing the leading 0
        return '+40' + cleaned
        
    # If it's a valid foreign number or something we can't parse easily but looks like a mobile
    if len(cleaned) >= 10:
        return '+' + cleaned if not cleaned.startswith('+') else cleaned
        
    return None

def main():
    if not os.path.exists(INPUT_JSON):
        print(f"Error: {INPUT_JSON} not found. Please run the PHP export first.")
        return
        
    print("Loading raw customer data...")
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        orders = json.load(f)
        
    print(f"Loaded {len(orders)} total orders.")
    
    unique_customers = {} # Map from Phone -> Data dict
    
    for order in orders:
        phone = clean_phone_number(order.get('phone', ''))
        
        if not phone:
            continue
            
        first_name = order.get('first_name', '').strip().capitalize()
        last_name = order.get('last_name', '').strip().capitalize()
        order_date = order.get('date', '')
        items = order.get('items', [])
        
        # If we already have this customer, we might want to append items or just keep the latest date
        if phone in unique_customers:
            existing = unique_customers[phone]
            # Keep newest order date
            if order_date > existing['Ultima_Comanda']:
                existing['Ultima_Comanda'] = order_date
            
            # Combine unique items
            for item in items:
                if item not in existing['Produse_Achiziționate']:
                    existing['Produse_Achiziționate'].append(item)
                    
            existing['Numar_Comenzi'] += 1
        else:
            unique_customers[phone] = {
                'Telefon': phone,
                'Prenume': first_name,
                'Nume': last_name,
                'Ultima_Comanda': order_date,
                'Numar_Comenzi': 1,
                'Produse_Achiziționate': items
            }
            
    # Convert back to list for DataFrame
    final_data = []
    for phone, data in unique_customers.items():
        # Stringify the items list for CSV output
        data['Produse_Achiziționate'] = " | ".join(data['Produse_Achiziționate'])
        final_data.append(data)
        
    df = pd.DataFrame(final_data)
    
    if df.empty:
        print("No valid mobile numbers found.")
        return
        
    # Sort by newest orders first
    df = df.sort_values(by="Ultima_Comanda", ascending=False)
    
    df.to_csv(OUTPUT_CSV, index=False, encoding='utf-8-sig') # utf-8-sig helps Excel read diacritics
    
    print(f"\n--- SMS Campaign Export Success ---")
    print(f"Total Unique Valid Customers extracted: {len(df)}")
    print(f"Report saved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
