# Soluție Alternativă - Import Manual prin WordPress Admin

## 🚨 Situația Actuală

WordPress Importer nu funcționează nici prin UI, nici prin WP-CLI din cauza problemelor de activare a plugin-ului.

## ✅ Soluții Alternative

### Opțiunea 1: Import Manual prin WordPress Admin (Simplu)

**Pași:**

1. **Reactivează mu-plugin:**
```bash
docker exec climaticpro-wordpress-1 mv \
  /var/www/html/wp-content/mu-plugins/disable-updates.php.bak \
  /var/www/html/wp-content/mu-plugins/disable-updates.php
```

2. **Accesează WordPress Admin:**
   - https://cms.climaticpro.ro/wp-admin/

3. **Creează manual pages și posts:**
   - Copiază conținutul din site-ul vechi
   - Creează în site-ul nou
   - Upload imagini manual

**Avantaj:** Funcționează 100%  
**Dezavantaj:** Necesită timp pentru fiecare page/post

---

### Opțiunea 2: Folosește Plugin WP All Import (Recomandat)

**Instalare:**
```bash
docker exec climaticpro-wordpress-1 wp plugin install wp-all-import --activate --allow-root
```

**Pași:**
1. Accesează: https://cms.climaticpro.ro/wp-admin/admin.php?page=pmxi-admin-import
2. Upload XML: `/tmp/export.xml`
3. Selectează tip import: "New Items"
4. Map fields automat
5. Run import

**Avantaj:** Cel mai puternic tool de import, UI intuitiv  
**Dezavantaj:** Plugin premium pentru features avansate (versiunea free poate fi suficientă)

---

### Opțiunea 3: Import prin phpMyAdmin (Avansat)

**Dacă ai acces la phpMyAdmin:**

1. Exportă tabele din site vechi:
   - `wp_posts`
   - `wp_postmeta`
   - `wp_terms`
   - `wp_term_relationships`

2. Importă în site nou
3. Update URLs în `wp_posts`:
```sql
UPDATE wp_posts 
SET guid = REPLACE(guid, 'https://climaticpro.ro', 'https://cms.climaticpro.ro');

UPDATE wp_posts 
SET post_content = REPLACE(post_content, 'https://climaticpro.ro', 'https://cms.climaticpro.ro');
```

---

### Opțiunea 4: Copiază Folder Uploads (Pentru Imagini)

**Dacă ai acces SSH la site-ul vechi:**

```bash
# Pe serverul vechi
cd /path/to/old/site
tar -czf uploads.tar.gz wp-content/uploads/

# Copiază pe serverul nou
scp uploads.tar.gz user@new-server:/tmp/

# Pe serverul nou
docker cp /tmp/uploads.tar.gz climaticpro-wordpress-1:/tmp/
docker exec climaticpro-wordpress-1 bash -c "cd /var/www/html/wp-content/ && tar -xzf /tmp/uploads.tar.gz"
docker exec climaticpro-wordpress-1 chown -R www-data:www-data /var/www/html/wp-content/uploads/
```

---

## 🎯 Recomandarea Mea

**Pentru ClimaticPro:**

1. **Instalează WP All Import** (versiunea free)
2. Folosește UI-ul pentru import XML
3. Copiază manual folder uploads pentru imagini (dacă ai acces)

**SAU**

Dacă sunt puține pages/posts (< 20), **creează manual** - este mai rapid decât debugging WordPress Importer.

---

## 📊 Câte Pages/Posts Sunt?

Verifică în XML:
```bash
grep -c "<item>" /home/asns/projects/climaticpro/frontend/docs/climaticpro.WordPress.2025-12-21.xml
```

Dacă sunt < 20 items, **import manual este mai rapid**.  
Dacă sunt > 20 items, **folosește WP All Import**.

---

## 🔙 Reactivare mu-plugin

```bash
docker exec climaticpro-wordpress-1 mv \
  /var/www/html/wp-content/mu-plugins/disable-updates.php.bak \
  /var/www/html/wp-content/mu-plugins/disable-updates.php
```

---

## 💡 De Ce Nu Funcționează WordPress Importer?

WordPress Importer are o problemă cunoscută în anumite configurații Docker/PHP unde:
- Plugin-ul se instalează corect
- Dar nu se activează complet
- Clasa `WP_Import` nu se încarcă

**Soluția:** Folosește alternative mai moderne (WP All Import) sau import manual.
