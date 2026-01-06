# Soluție Import WooCommerce - Fără WordPress Importer

## 🎯 Recomandare: Folosește WooCommerce CSV Import

WordPress Importer are probleme de activare. **Soluția mai bună:** folosește direct **WooCommerce CSV Import** care este:
- ✅ Built-in în WooCommerce (deja instalat)
- ✅ Nu necesită plugin-uri extra
- ✅ Mult mai bun pentru produse WooCommerce
- ✅ Importă toate meta data, variații, atribute

---

## 📦 Pași Import Produse WooCommerce

### 1. Exportă din Site-ul Vechi

**Accesează:** https://climaticpro.ro/wp-admin/

**Pași:**
1. WooCommerce → Products
2. Click butonul **"Export"** (sus, lângă "Add New")
3. Selectează opțiuni:
   - Export Type: "All products"
   - Columns: "All columns" (sau selectează specific)
4. Click **"Generate CSV"**
5. Download fișierul CSV

---

### 2. Importă în Site-ul Nou

**Accesează:** https://cms.climaticpro.ro/wp-admin/

**Pași:**
1. WooCommerce → Products
2. Click butonul **"Import"** (sus, lângă "Add New")
3. **Upload CSV:**
   - Click "Choose File"
   - Selectează CSV-ul exportat
   - Click "Continue"

4. **Map Columns:**
   - WooCommerce va detecta automat majoritatea coloanelor
   - Verifică că mapping-ul este corect
   - Click "Continue"

5. **Run Import:**
   - Verifică preview
   - Click "Run the importer"
   - Așteaptă finalizarea (poate dura câteva minute)

6. **Verifică Rezultate:**
   - Verifică numărul de produse importate
   - Verifică câteva produse random pentru acuratețe

---

## 🗂️ Import Categorii și Atribute

### Opțiunea A: Prin CSV

**Categorii CSV format:**
```csv
name,slug,parent,description
"Aer condiționat rezidențial","aer-conditionat-rezidential","","Sisteme pentru case"
"Split de perete","split-de-perete","aer-conditionat-rezidential","Unități split"
```

**Import:**
- WooCommerce → Products → Categories
- Sau folosește WP All Import pentru CSV categorii

### Opțiunea B: Prin WP-CLI (Rapid)

```bash
# Exemplu creare categorie
docker exec climaticpro-wordpress-1 wp wc product_cat create \
  --name="Aer condiționat rezidențial" \
  --slug="aer-conditionat-rezidential" \
  --allow-root

# Exemplu creare atribut
docker exec climaticpro-wordpress-1 wp wc product_attribute create \
  --name="BTU" \
  --slug="btu" \
  --type="select" \
  --allow-root
```

---

## 🖼️ Import Imagini

### Metoda 1: Prin CSV Import (Automat)

Dacă CSV-ul conține URL-uri imagini, WooCommerce le va descărca automat:

```csv
ID,Name,Images
123,"Aer condiționat Gree","https://climaticpro.ro/wp-content/uploads/2024/01/gree-1.jpg|https://climaticpro.ro/wp-content/uploads/2024/01/gree-2.jpg"
```

### Metoda 2: Manual (Pentru imagini lipsă)

1. Media → Add New
2. Upload imagini
3. Asociază cu produsele în Products → Edit Product

---

## 📊 Verificare Post-Import

### Checklist:

```bash
# Număr total produse
docker exec climaticpro-wordpress-1 wp post list --post_type=product --format=count --allow-root

# Produse publicate
docker exec climaticpro-wordpress-1 wp post list --post_type=product --post_status=publish --format=count --allow-root

# Produse cu imagini
docker exec climaticpro-wordpress-1 wp post list --post_type=product --meta_key=_thumbnail_id --format=count --allow-root

# Categorii
docker exec climaticpro-wordpress-1 wp term list product_cat --format=count --allow-root
```

### Verificare Manuală:

- [ ] Verifică 5-10 produse random
- [ ] Verifică categorii asociate
- [ ] Verifică imagini featured
- [ ] Verifică prețuri
- [ ] Verifică stock status
- [ ] Verifică variații (dacă există)
- [ ] Verifică atribute

---

## 🔧 Troubleshooting

### Eroare: "Memory limit exceeded"

**Soluție:** Importă în batch-uri mai mici (50-100 produse)

### Imagini nu se importă

**Soluție:**
1. Verifică că URL-urile imaginilor sunt accesibile
2. Verifică permisiuni folder `wp-content/uploads/`
3. Sau importă imagini separat

### Variații nu se importă corect

**Soluție:**
1. Verifică că CSV-ul conține toate coloanele pentru variații
2. Folosește WP All Import pentru control mai fin

---

## 💡 Alternative: WP All Import (Premium)

Dacă CSV Import nu funcționează perfect, **WP All Import** este cel mai puternic tool:

**Instalare:**
```bash
docker exec climaticpro-wordpress-1 wp plugin install wp-all-import --activate --allow-root
```

**Avantaje:**
- ✅ Mapping vizual drag & drop
- ✅ Suportă orice format (XML, CSV, Excel, JSON)
- ✅ Import variații complexe
- ✅ Update produse existente
- ✅ Scheduling automat

**Cost:** $99/an pentru versiunea Pro (opțional)

---

## ⏱️ Timp Estimat

- Export CSV din site vechi: **5 minute**
- Import CSV în site nou: **10-20 minute** (depinde de număr produse)
- Verificare și ajustări: **30-60 minute**

**Total:** ~1 oră pentru import complet

---

## 🎯 Recomandare Finală

1. **Folosește WooCommerce CSV Import** (nu WordPress Importer)
2. Exportă CSV din https://climaticpro.ro/wp-admin/
3. Importă în https://cms.climaticpro.ro/wp-admin/
4. Verifică produsele
5. Dacă lipsesc date, folosește WP All Import pentru control mai fin

**WordPress Importer nu este necesar pentru produse WooCommerce!**

---

## 📞 Suport

Dacă ai probleme cu CSV Import, trimite-mi:
- Screenshot din pasul unde blochează
- Numărul de produse din site vechi
- Erori din browser console (F12)
