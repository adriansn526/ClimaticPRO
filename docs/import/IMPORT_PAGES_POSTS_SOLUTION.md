# Import Pages și Posts - Soluție Directă

## ✅ WordPress Importer este ACTIV!

Plugin-ul este instalat și activ în baza de date, dar WordPress Admin nu îl recunoaște corect prin meniul Tools → Import.

---

## 🚀 Soluție: Accesează Direct URL-ul Importerului

### Metoda 1: URL Direct (Recomandat)

**Accesează direct:**
```
https://cms.climaticpro.ro/wp-admin/admin.php?import=wordpress
```

**SAU**

```
https://cms.climaticpro.ro/wp-admin/admin.php?page=wordpress-importer
```

Acesta va deschide direct WordPress Importer, ocolind meniul Tools → Import.

---

## 📦 Pași Import Pages și Posts

### 1. Exportă din Site Vechi

**Accesează:** https://climaticpro.ro/wp-admin/

**Pași:**
1. **Tools → Export**
2. Selectează ce vrei să exporți:
   - ☑️ **Pages** (pentru pagini)
   - ☑️ **Posts** (pentru articole blog)
   - Sau **"All content"** (tot)
3. Click **"Download Export File"**
4. Salvează fișierul XML (ex: `climaticpro.wordpress.2025-12-21.xml`)

---

### 2. Importă în Site Nou

**Accesează direct importerul:**
```
https://cms.climaticpro.ro/wp-admin/admin.php?import=wordpress
```

**Pași:**
1. Click **"Choose File"**
2. Selectează XML-ul exportat
3. Click **"Upload file and import"**
4. **Assign Authors:**
   - Map authors din site vechi la authors din site nou
   - Sau creează author nou
5. **Import Attachments:**
   - ☑️ **Bifează "Download and import file attachments"** (pentru imagini)
6. Click **"Submit"**
7. Așteaptă finalizarea (poate dura câteva minute)

---

## ⚠️ Important: Imagini

### Opțiunea A: Import Automat (Recomandat)

Bifează **"Download and import file attachments"** la pasul 5.

WordPress va descărca automat toate imaginile din site-ul vechi.

### Opțiunea B: Import Manual (Dacă automat nu funcționează)

Dacă imaginile nu se importă automat:

1. **Exportă imagini din site vechi:**
```bash
# Pe serverul vechi
cd /path/to/old/site
tar -czf uploads.tar.gz wp-content/uploads/
```

2. **Importă în site nou:**
```bash
# Pe serverul nou
docker cp uploads.tar.gz climaticpro-wordpress-1:/tmp/
docker exec climaticpro-wordpress-1 bash -c "cd /var/www/html/wp-content/ && tar -xzf /tmp/uploads.tar.gz"
docker exec climaticpro-wordpress-1 chown -R www-data:www-data /var/www/html/wp-content/uploads/
```

---

## 🔍 Verificare Post-Import

### Verificare Pages

```bash
# Număr total pages
docker exec climaticpro-wordpress-1 wp post list --post_type=page --format=count --allow-root

# Pages publicate
docker exec climaticpro-wordpress-1 wp post list --post_type=page --post_status=publish --format=count --allow-root

# Lista pages
docker exec climaticpro-wordpress-1 wp post list --post_type=page --fields=ID,post_title,post_status --allow-root
```

### Verificare Posts

```bash
# Număr total posts
docker exec climaticpro-wordpress-1 wp post list --post_type=post --format=count --allow-root

# Posts publicate
docker exec climaticpro-wordpress-1 wp post list --post_type=post --post_status=publish --format=count --allow-root

# Lista posts
docker exec climaticpro-wordpress-1 wp post list --post_type=post --fields=ID,post_title,post_status --allow-root
```

### Verificare Imagini

```bash
# Număr total attachments (imagini)
docker exec climaticpro-wordpress-1 wp post list --post_type=attachment --format=count --allow-root
```

---

## 🎯 Checklist Post-Import

- [ ] Toate pages importate (verifică număr)
- [ ] Toate posts importate (verifică număr)
- [ ] Imagini featured setate corect
- [ ] Galerii imagini funcționează
- [ ] Link-uri interne funcționează
- [ ] Categorii și tags asociate
- [ ] Autori mapați corect
- [ ] Meta data SEO (dacă folosești Rank Math)

---

## 🔧 Troubleshooting

### Eroare: "Memory limit exceeded"

**Soluție:** Exportă în batch-uri mai mici:
- Exportă doar pages
- Apoi exportă doar posts
- Importă separat

### Eroare: "Timeout during import"

**Soluție:** Mărește timeout în `php-uploads.ini`:
```ini
max_execution_time = 600
```

Apoi restart container:
```bash
docker compose -f /home/asns/projects/climaticpro/docker-compose.yml restart wordpress
```

### Imagini nu se importă

**Verifică:**
1. Bifat "Download and import file attachments"
2. Permisiuni folder uploads:
```bash
docker exec climaticpro-wordpress-1 chmod -R 755 /var/www/html/wp-content/uploads/
docker exec climaticpro-wordpress-1 chown -R www-data:www-data /var/www/html/wp-content/uploads/
```

### Link-uri interne broken

**Soluție:** Update URLs în baza de date:
```bash
docker exec climaticpro-wordpress-1 wp search-replace \
  'https://climaticpro.ro' \
  'https://cms.climaticpro.ro' \
  --allow-root
```

---

## 📊 Comenzi Utile

### Export din Site Vechi (WP-CLI)

```bash
# Export toate pages
wp export --post_type=page --dir=/tmp/

# Export toate posts
wp export --post_type=post --dir=/tmp/

# Export tot
wp export --dir=/tmp/
```

### Import în Site Nou (WP-CLI)

```bash
# Import XML
docker exec climaticpro-wordpress-1 wp import /path/to/export.xml \
  --authors=create \
  --allow-root

# Import cu download imagini
docker exec climaticpro-wordpress-1 wp import /path/to/export.xml \
  --authors=create \
  --fetch_attachments \
  --allow-root
```

---

## ⏱️ Timp Estimat

- Export XML din site vechi: **2-5 minute**
- Upload și import XML: **5-15 minute** (depinde de mărime)
- Download imagini: **10-30 minute** (depinde de număr)
- Verificare și ajustări: **15-30 minute**

**Total:** ~30-60 minute pentru import complet

---

## 🎯 Recomandare Finală

1. **Accesează direct:** https://cms.climaticpro.ro/wp-admin/admin.php?import=wordpress
2. Upload XML exportat din site vechi
3. Bifează "Download and import file attachments"
4. Submit și așteaptă
5. Verifică pages/posts/imagini

**WordPress Importer este activ și funcțional prin URL direct!**

---

## 📞 Dacă Ai Probleme

Trimite-mi:
- Screenshot din pasul unde blochează
- Mărimea fișierului XML
- Erori din browser console (F12)
- Output din comenzile de verificare
