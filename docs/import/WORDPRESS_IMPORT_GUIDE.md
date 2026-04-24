# WordPress Import Guide - ClimaticPro

## 🚨 Problema: URL invalid la import

**Eroare:** `https://cms.climaticpro.ro/wp-admin/import.php?invalid=wordpress`

**Cauză:** Plugin-ul "WordPress Importer" nu este instalat sau nu este activat.

---

## ✅ Soluție: Instalare WordPress Importer

### Metoda 1: Prin WordPress Admin (Recomandat)

1. **Accesează:** https://cms.climaticpro.ro/wp-admin/
2. **Navighează:** Plugins → Add New
3. **Caută:** "WordPress Importer"
4. **Instalează:** Click "Install Now" pe plugin-ul oficial (by wordpressdotorg)
5. **Activează:** Click "Activate"
6. **Accesează:** Tools → Import → WordPress → "Run Importer"

### Metoda 2: Prin WP-CLI (Rapid)

```bash
# Intră în containerul WordPress
docker exec -it climaticpro-wordpress bash

# Instalează WordPress Importer
wp plugin install wordpress-importer --activate --allow-root

# Verifică instalarea
wp plugin list --allow-root
```

---

## 📦 Import Date WooCommerce

### Opțiunea A: Import XML (Pentru produse simple)

**Pași:**

1. **Exportă din site-ul vechi:**
   - Accesează: https://climaticpro.ro/wp-admin/
   - Tools → Export
   - Selectează: "Products" (WooCommerce)
   - Download Export File

2. **Importă în site-ul nou:**
   - Accesează: https://cms.climaticpro.ro/wp-admin/
   - Tools → Import → WordPress → Run Importer
   - Upload XML file
   - Map authors (sau creează nou)
   - Check "Download and import file attachments" (pentru imagini)
   - Submit

**⚠️ Limitări:**
- Nu importă variații complexe
- Nu importă meta data custom
- Poate avea probleme cu imagini mari

---

### Opțiunea B: WooCommerce Product CSV Import (Recomandat)

**Pași:**

1. **Exportă CSV din site vechi:**
   - WooCommerce → Products
   - Click "Export" (buton sus)
   - Selectează câmpurile dorite
   - Generate CSV

2. **Importă CSV în site nou:**
   - WooCommerce → Products
   - Click "Import" (buton sus)
   - Upload CSV file
   - Map columns (automat în majoritatea cazurilor)
   - Run import

**✅ Avantaje:**
- Importă toate meta data
- Importă variații
- Mai rapid decât XML
- Poate fi editat manual în Excel/Google Sheets

---

### Opțiunea C: WP All Import (Plugin Premium - Cel mai puternic)

**Plugin:** WP All Import + WooCommerce Add-on

**Pași:**

1. **Instalează WP All Import:**
   - Plugins → Add New → "WP All Import"
   - Activează (versiune free sau pro)

2. **Instalează WooCommerce Add-on:**
   - WP All Import → Settings
   - Download WooCommerce Add-on
   - Activează

3. **Creează import:**
   - All Import → New Import
   - Upload XML/CSV din site vechi
   - Map fields vizual (drag & drop)
   - Preview și run import

**✅ Avantaje:**
- Cel mai puternic tool de import
- Suportă orice format (XML, CSV, Excel, JSON)
- Mapping vizual foarte ușor
- Poate importa orice: produse, categorii, atribute, variații, imagini
- Poate face update la produse existente

**💰 Cost:** $99/an pentru versiunea Pro (opțional, versiunea free poate fi suficientă)

---

## 🔧 Import Categorii și Atribute

### Categorii WooCommerce

**Metoda 1: Manual (pentru puține categorii)**
- Products → Categories
- Add New pentru fiecare categorie

**Metoda 2: CSV Import**
```csv
name,slug,parent,description
"Aer condiționat rezidențial","aer-conditionat-rezidential","","Sisteme pentru case și apartamente"
"Split de perete","split-de-perete","aer-conditionat-rezidential","Unități split clasice"
```

**Metoda 3: WP-CLI**
```bash
wp wc product_cat create --name="Aer condiționat rezidențial" --slug="aer-conditionat-rezidential" --allow-root
```

### Atribute WooCommerce

**Metoda 1: Manual**
- Products → Attributes
- Add New pentru fiecare atribut (BTU, Brand, Tip, etc.)

**Metoda 2: WP-CLI**
```bash
wp wc product_attribute create --name="BTU" --slug="btu" --type="select" --allow-root
wp wc product_attribute create --name="Brand" --slug="brand" --type="select" --allow-root
```

---

## 📊 Verificare Import

### Checklist Post-Import

- [ ] Produse importate corect (verifică 5-10 produse random)
- [ ] Categorii asociate corect
- [ ] Atribute și variații funcționează
- [ ] Imagini featured setate
- [ ] Galerii imagini complete
- [ ] Prețuri corecte
- [ ] Stock status corect
- [ ] Descrieri scurte și lungi prezente
- [ ] SKU-uri unice
- [ ] Meta data SEO (dacă folosești Yoast/Rank Math)

### Comenzi WP-CLI pentru verificare

```bash
# Număr total produse
wp post list --post_type=product --format=count --allow-root

# Produse publicate
wp post list --post_type=product --post_status=publish --format=count --allow-root

# Produse cu imagini
wp post list --post_type=product --meta_key=_thumbnail_id --format=count --allow-root

# Categorii produse
wp term list product_cat --format=count --allow-root

# Atribute produse
wp wc product_attribute list --format=count --allow-root
```

---

## 🚀 Recomandarea Mea

### Pentru ClimaticPro:

**Pas 1: Instalează WordPress Importer**
```bash
docker exec -it climaticpro-wordpress wp plugin install wordpress-importer --activate --allow-root
```

**Pas 2: Folosește WooCommerce CSV Import**
- Exportă CSV din https://climaticpro.ro/wp-admin/
- Importă în https://cms.climaticpro.ro/wp-admin/
- Verifică produsele

**Pas 3 (Opțional): WP All Import pentru import avansat**
- Dacă CSV import nu funcționează perfect
- Sau dacă ai nevoie de control mai fin

---

## 📝 Date Conexiune WooCommerce API

**Site vechi (climaticpro.ro):**
- Consumer Key: `ck_fcb96bd1e295523361bc242b886cc901c514f288`
- Consumer Secret: `cs_b1719d8ac6bf391b6d6ae1fd9abedf826a55f5a5`

**Site nou (cms.climaticpro.ro):**
- Consumer Key: `ck_6e3eef12ca191def4c8c933dfa5a6d5b658189b1`
- Consumer Secret: `cs_0ce184308506a19a94ce12553c573d3f31105e4b`

**Folosire:**
- Pentru scripturi Python/Node.js de import custom
- Pentru sincronizare automată
- Pentru migrare programatică

---

## 🔗 Resurse Utile

- [WordPress Importer Plugin](https://wordpress.org/plugins/wordpress-importer/)
- [WooCommerce CSV Import Documentation](https://woocommerce.com/document/product-csv-importer-exporter/)
- [WP All Import](https://www.wpallimport.com/)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)

---

## ⏱️ Timp Estimat

- **Instalare WordPress Importer:** 2 minute
- **Export produse din site vechi:** 5-10 minute
- **Import CSV în site nou:** 10-20 minute (depinde de număr produse)
- **Verificare și ajustări:** 30-60 minute

**Total:** ~1-2 ore pentru import complet

---

## 🆘 Troubleshooting

### Eroare: "Memory limit exceeded"

**Soluție:**
```bash
# Mărește memory limit în php-uploads.ini
upload_max_filesize = 256M
post_max_size = 256M
memory_limit = 512M
```

### Eroare: "Timeout during import"

**Soluție:**
- Importă în batch-uri mai mici (50-100 produse)
- Sau mărește `max_execution_time` în PHP config

### Imagini nu se importă

**Soluție:**
1. Verifică că "Download and import file attachments" este bifat
2. Verifică permisiuni folder `wp-content/uploads/`
3. Sau importă imagini separat cu WP All Import

---

**Status:** Gata pentru import! 🚀
