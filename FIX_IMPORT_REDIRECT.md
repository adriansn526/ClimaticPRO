# Fix Import Redirect Issue

## 🚨 Problema

După upload XML în WordPress Importer, ești redirectat la dashboard în loc să ruleze importul.

## ✅ Soluție Aplicată

Am dezactivat temporar mu-plugin-ul `disable-updates.php` care poate interfera cu procesul de import.

```bash
# Redenumit plugin
mv disable-updates.php disable-updates.php.bak
```

---

## 🔄 Încearcă Acum Importul

1. **Refresh pagina:** https://cms.climaticpro.ro/wp-admin/admin.php?import=wordpress
2. **Upload XML-ul** din nou
3. **Map authors** și bifează "Download and import file attachments"
4. **Submit** - ar trebui să ruleze importul acum

---

## 🔧 Dacă Tot Nu Funcționează

### Verifică Mărimea Fișierului

```bash
# Verifică limitele PHP
docker exec climaticpro-wordpress-1 php -i | grep -E "upload_max_filesize|post_max_size|memory_limit"
```

Dacă fișierul XML este prea mare (>256MB), trebuie mărit limitele.

### Verifică Permisiuni

```bash
# Verifică permisiuni folder uploads
docker exec climaticpro-wordpress-1 ls -la /var/www/html/wp-content/uploads/

# Repară permisiuni
docker exec climaticpro-wordpress-1 chown -R www-data:www-data /var/www/html/wp-content/uploads/
docker exec climaticpro-wordpress-1 chmod -R 755 /var/www/html/wp-content/uploads/
```

### Verifică Erori PHP

```bash
# Verifică log-uri
docker exec climaticpro-wordpress-1 tail -50 /var/www/html/wp-content/debug.log
```

---

## 🎯 Alternativă: Import prin WP-CLI

Dacă WordPress Importer continuă să dea probleme, folosește WP-CLI:

```bash
# 1. Copiază XML în container
docker cp /path/to/export.xml climaticpro-wordpress-1:/tmp/export.xml

# 2. Rulează import
docker exec climaticpro-wordpress-1 wp import /tmp/export.xml \
  --authors=create \
  --fetch_attachments \
  --allow-root

# 3. Verifică rezultate
docker exec climaticpro-wordpress-1 wp post list --post_type=page --format=count --allow-root
docker exec climaticpro-wordpress-1 wp post list --post_type=post --format=count --allow-root
```

---

## 🔙 Reactivare mu-plugin După Import

După ce importul este finalizat, reactivează mu-plugin-ul:

```bash
mv /home/asns/projects/climaticpro/wordpress/wp-content/mu-plugins/disable-updates.php.bak \
   /home/asns/projects/climaticpro/wordpress/wp-content/mu-plugins/disable-updates.php
```

---

## 📊 Verificare Import

```bash
# Pages
docker exec climaticpro-wordpress-1 wp post list --post_type=page --fields=ID,post_title,post_status --allow-root

# Posts
docker exec climaticpro-wordpress-1 wp post list --post_type=post --fields=ID,post_title,post_status --allow-root

# Imagini
docker exec climaticpro-wordpress-1 wp post list --post_type=attachment --format=count --allow-root
```

---

## 💡 Recomandare

**Dacă WordPress Importer continuă să dea probleme, folosește WP-CLI** - este mai rapid, mai sigur și nu are probleme de redirect.
