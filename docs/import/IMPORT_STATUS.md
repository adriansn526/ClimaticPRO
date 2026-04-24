# ClimaticPro - Status Import WooCommerce

## ✅ Ce Am Realizat

### 1. WordPress & Plugins Instalate
- ✅ WordPress 6.8.2 funcțional pe https://cms.climaticpro.ro
- ✅ WooCommerce 10.4.2 instalat și activat
- ✅ WP-CLI instalat în container
- ✅ Toate plugin-urile PRO instalate (ACF Pro, Rank Math Pro, etc.)

### 2. Configurări PHP
- ✅ upload_max_filesize: 256M
- ✅ post_max_size: 256M
- ✅ memory_limit: 512M
- ✅ max_execution_time: 300s

### 3. Date Exportate din climaticpro.ro
- ✅ **15 categorii produse** (13KB) - `/home/asns/projects/climaticpro/export/categories.json`
- ✅ **56 atribute cu termeni** (321KB) - `/home/asns/projects/climaticpro/export/attributes.json`
- ✅ **3 tag-uri** (1.7KB) - `/home/asns/projects/climaticpro/export/tags.json`
- ✅ **82 produse complete** (2.5MB) - `/home/asns/projects/climaticpro/export/products.json`

### 4. API Keys Generate
- Consumer Key: `ck_276305bd4bca6a6ae264d5a9faf12a4a`
- Consumer Secret: `cs_851a8cf0c7facf0f215891f96949d79d`
- Salvate în: `/home/asns/projects/climaticpro/wc-api-keys.txt`

## ⚠️ Probleme Întâmpinate

### WooCommerce se Dezactivează Automat
**Cauză**: Erori de încărcare traduceri (PHP Notice) cauzează dezactivarea plugin-ului
**Status**: WooCommerce este acum activ, dar instabil
**Soluție aplicată**: Dezactivat WP_DEBUG

### WooCommerce REST API Instabil
**Cauză**: Plugin-ul se dezactivează periodic, API-ul devine indisponibil
**Status**: API-ul nu răspunde consistent
**Soluție**: Import manual prin WordPress admin

### WP-CLI WooCommerce Commands Incomplete
**Cauză**: Comenzile `wp wc` nu sunt complet disponibile în WP-CLI
**Status**: Unele comenzi funcționează, altele nu
**Rezultat**: Câteva categorii importate, dar proces incomplet

## 📋 Soluții Recomandate pentru Import

### Opțiunea 1: Import Manual prin WordPress Admin (RECOMANDAT)
**Avantaje**: Cel mai sigur, interfață vizuală, control complet
**Pași**:
1. Accesează https://cms.climaticpro.ro/wp-admin/
2. WooCommerce → Products → Import
3. Folosește fișierul CSV generat din JSON
4. Mapează câmpurile
5. Rulează importul

**Script de conversie JSON → CSV**:
```bash
python3 /home/asns/projects/climaticpro/convert-json-to-csv.py
```

### Opțiunea 2: WordPress Importer Plugin
**Avantaje**: Import bulk, include imagini, categorii, taxonomii
**Pași**:
1. Instalează plugin "WordPress Importer"
2. Tools → Import → WordPress
3. Upload fișier XML generat
4. Rulează importul

### Opțiunea 3: WooCommerce Product CSV Import
**Avantaje**: Format nativ WooCommerce, include toate atributele
**Pași**:
1. Convertește JSON → CSV cu scriptul Python
2. WooCommerce → Products → Import
3. Upload CSV
4. Mapează câmpuri automat

## 📊 Date Disponibile pentru Import

### Categorii (15)
```json
- aer conditionat
- Aparate de aer comerciale
- Aparate de aer conditionat 12.000 BTU
- Aparate de aer conditionat 18000 BTU
- Aparate de aer conditionat 24000 BTU
- ... (și altele)
```

### Atribute (56)
```json
- Agent frigorific (1 termeni)
- Alimentare (2 termeni)
- Brand (11 termeni)
- Capacitate (7 termeni)
- Model (33 termeni)
- ... (și altele)
```

### Produse (82)
- Toate produsele au: nume, SKU, preț, descriere, imagini
- Produse simple (82), fără variații
- Imagini incluse (URL-uri externe)

## 🚀 Next Steps

### Imediat
1. **Verifică stabilitatea WooCommerce** - accesează WP Admin și confirmă că WooCommerce funcționează
2. **Alege metoda de import** - manual prin admin sau CSV
3. **Convertește datele** - rulează scriptul de conversie JSON → CSV

### Pentru Import Complet
```bash
# 1. Conversie JSON → CSV
python3 /home/asns/projects/climaticpro/convert-json-to-csv.py

# 2. Import prin WordPress Admin
# - Accesează WooCommerce → Products → Import
# - Upload CSV generat
# - Mapează câmpuri
# - Rulează import

# 3. Verificare
# - Verifică categorii: WooCommerce → Products → Categories
# - Verifică atribute: WooCommerce → Products → Attributes
# - Verifică produse: WooCommerce → Products
```

## 📝 Informații Importante

### Credențiale WordPress
- URL: https://cms.climaticpro.ro/wp-admin/
- User: admin
- Email: adrian@climaticpro.ro

### Credențiale Database
- Database: climaticpro_wp
- User: climaticpro_wp
- Password: XWBTMMTF0KWTEp7wVzrY

### Credențiale WooCommerce API
- Consumer Key: ck_276305bd4bca6a6ae264d5a9faf12a4a
- Consumer Secret: cs_851a8cf0c7facf0f215891f96949d79d

### Fișiere Export
- Categorii: `/home/asns/projects/climaticpro/export/categories.json`
- Atribute: `/home/asns/projects/climaticpro/export/attributes.json`
- Tag-uri: `/home/asns/projects/climaticpro/export/tags.json`
- Produse: `/home/asns/projects/climaticpro/export/products.json`

## 🎯 Recomandare Finală

**Cea mai sigură și rapidă metodă**: Import manual prin WordPress Admin folosind WooCommerce Product CSV Importer.

1. Convertește JSON → CSV cu scriptul Python
2. Accesează WooCommerce → Products → Import
3. Upload CSV și rulează importul
4. Verifică rezultatele

Acest proces este vizual, controlabil și nu depinde de API-uri instabile.
