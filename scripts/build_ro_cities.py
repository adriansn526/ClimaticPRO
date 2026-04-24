import json

# A simplified but extensive list to start with, grouped by county
ro_data = {
    "Bucuresti": ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"],
    "Ilfov": ["Voluntari", "Otopeni", "Pantelimon", "Bragadiru", "Popesti Leordeni", "Buftea"],
    "Cluj": ["Cluj-Napoca", "Turda", "Dej", "Campia Turzii", "Gherla", "Huedin"],
    "Timis": ["Timisoara", "Lugoj", "Sannicolau Mare", "Jimbolia", "Buzias", "Faget"],
    "Iasi": ["Iasi", "Pascani", "Harlau", "Targu Frumos", "Podu Iloaiei"],
    "Constanta": ["Constanta", "Mangalia", "Medgidia", "Navodari", "Cernavoda", "Ovidiu", "Murfatlar", "Harsova", "Eforie"],
    "Brasov": ["Brasov", "Fagaras", "Sacele", "Zarnesti", "Codlea", "Rasnov", "Victoria", "Rupea", "Predeal"],
    "Suceava": ["Suceava", "Falticeni", "Radauti", "Campulung Moldovenesc", "Vatra Dornei", "Vicovu de Sus", "Gura Humorului", "Dolhasca"],
    "Prahova": ["Ploiesti", "Campina", "Baicoi", "Breaza", "Mizil", "Comarnic", "Valenii de Munte", "Boldesti-Scaeni", "Urlati", "Sinaia", "Busteni", "Azuga"],
    "Dolj": ["Craiova", "Bailesti", "Calafat", "Filiasi", "Dabuleni", "Segarcea", "Bechet"]
}

with open('/home/asns/ClimaticPRO/mobile/assets/romania-localities.json', 'w') as f:
    json.dump(ro_data, f, indent=2)

print("Created romania-localities.json")
