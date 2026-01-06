# Import Pages/Posts prin WP-CLI - Soluția Finală

## 🎯 Concluzie

WordPress Importer nu funcționează prin interfața admin. **Soluția:** folosește WP-CLI care este:
- ✅ Mai rapid
- ✅ Mai sigur
- ✅ Nu are probleme de redirect sau erori UI
- ✅ Oferă control complet

---

## 📦 Pași Import prin WP-CLI

### 1. Exportă XML din Site Vechi

**Accesează:** https://climaticpro.ro/wp-admin/

1. **Tools → Export**
2. Selectează ce vrei:
   - ☑️ Pages
   - ☑️ Posts
   - Sau "All content"
3. **Download Export File**
4. Salvează XML-ul (ex: `climaticpro-export.xml`)

---

### 2. Copiază XML în Container

```bash
# Înlocuiește /path/to/climaticpro-export.xml cu calea reală
docker cp /path/to/climaticpro-export.xml climaticpro-wordpress-1:/tmp/export.xml
```

**Exemplu:**
```bash
# Dacă XML-ul este în Downloads
docker cp ~/Downloads/climaticpro-export.xml climaticpro-wordpress-1:/tmp/export.xml
```

---

### 3. Rulează Import

```bash
docker exec climaticpro-wordpress-1 wp import /tmp/export.xml \
  --authors=create \
  --fetch_attachments \
  --allow-root
```

**Parametri:**
- `--authors=create` - Creează autori noi dacă nu există
- `--fetch_attachments` - Descarcă și importă imagini automat
- `--allow-root` - Permite rulare ca root în container

---

### 4. Verifică Rezultatele

```bash
# Număr pages importate
docker exec climaticpro-wordpress-1 wp post list --post_type=page --format=count --allow-root

# Număr posts importate
docker exec climaticpro-wordpress-1 wp post list --post_type=post --format=count --allow-root

# Număr imagini importate
docker exec climaticpro-wordpress-1 wp post list --post_type=attachment --format=count --allow-root

# Lista pages
docker exec climaticpro-wordpress-1 wp post list --post_type=page --fields=ID,post_title,post_status --allow-root

# Lista posts
docker exec climaticpro-wordpress-1 wp post list --post_type=post --fields=ID,post_title,post_status --allow-root
```

---

## 🎨 Opțiuni Avansate

### Import Fără Imagini (Mai Rapid)

```bash
docker exec climaticpro-wordpress-1 wp import /tmp/export.xml \
  --authors=create \
  --allow-root
```

### Import cu Skip Duplicates

```bash
docker exec climaticpro-wordpress-1 wp import /tmp/export.xml \
  --authors=create \
  --fetch_attachments \
  --skip=image \
  --allow-root
```

### Import cu Mapping Autori Specific

```bash
# Map author vechi la author nou
docker exec climaticpro-wordpress-1 wp import /tmp/export.xml \
  --authors=1:2 \
  --fetch_attachments \
  --allow-root
```

---

## 🔍 Troubleshooting

### Eroare: "Memory limit exceeded"

**Soluție:** Mărește memory limit temporar:

```bash
docker exec climaticpro-wordpress-1 wp import /tmp/export.xml \
  --authors=create \
  --fetch_attachments \
  --allow-root \
  --php-memory-limit=512M
```

### Eroare: "Timeout"

**Soluție:** Importă în batch-uri:

1. Exportă doar pages din site vechi
2. Importă pages
3. Exportă doar posts
4. Importă posts

### Imagini Nu Se Descarcă

**Verifică:**

```bash
# Verifică permisiuni uploads
docker exec climaticpro-wordpress-1 ls -la /var/www/html/wp-content/uploads/

# Repară permisiuni
docker exec climaticpro-wordpress-1 chown -R www-data:www-data /var/www/html/wp-content/uploads/
docker exec climaticpro-wordpress-1 chmod -R 755 /var/www/html/wp-content/uploads/
```

### Link-uri Interne Broken

**Fix:** Update URLs în baza de date:

```bash
docker exec climaticpro-wordpress-1 wp search-replace \
  'https://climaticpro.ro' \
  'https://cms.climaticpro.ro' \
  --allow-root
```

---

## 📊 Comenzi Utile Post-Import

### Regenerare Thumbnails

```bash
# Dacă imaginile nu au thumbnails
docker exec climaticpro-wordpress-1 wp media regenerate --yes --allow-root
```

### Flush Cache

```bash
docker exec climaticpro-wordpress-1 wp cache flush --allow-root
```

### Reindex Rank Math SEO

```bash
docker exec climaticpro-wordpress-1 wp rank-math sitemap generate --allow-root
```

### Update Permalinks

```bash
docker exec climaticpro-wordpress-1 wp rewrite flush --allow-root
```

---

## 🎯 Checklist Post-Import

- [ ] Verificat număr pages (match cu site vechi)
- [ ] Verificat număr posts (match cu site vechi)
- [ ] Verificat imagini featured
- [ ] Verificat galerii imagini
- [ ] Verificat link-uri interne
- [ ] Verificat categorii și tags
- [ ] Verificat meta data SEO
- [ ] Flush cache și permalinks
- [ ] Testat câteva pages/posts în browser

---

## 🔙 Reactivare mu-plugin

După import, reactivează mu-plugin-ul:

```bash
docker exec climaticpro-wordpress-1 mv \
  /var/www/html/wp-content/mu-plugins/disable-updates.php.bak \
  /var/www/html/wp-content/mu-plugins/disable-updates.php
```

---

## ⏱️ Timp Estimat

- Copiere XML în container: **30 secunde**
- Import pages/posts: **5-15 minute**
- Download imagini: **10-30 minute** (depinde de număr)
- Verificare: **10-15 minute**

**Total:** ~30-60 minute

---

## 💡 Avantaje WP-CLI vs UI

| Aspect | WordPress Importer UI | WP-CLI |
|--------|----------------------|--------|
| Stabilitate | ❌ Erori frecvente | ✅ Foarte stabil |
| Viteză | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Control | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Debugging | ❌ Dificil | ✅ Output detaliat |
| Batch Import | ❌ Nu | ✅ Da |
| Memory Limit | ❌ Fix | ✅ Configurabil |

---

## 📞 Exemplu Complet

```bash
# 1. Copiază XML
docker cp ~/Downloads/climaticpro-export.xml climaticpro-wordpress-1:/tmp/export.xml

# 2. Rulează import
docker exec climaticpro-wordpress-1 wp import /tmp/export.xml \
  --authors=create \
  --fetch_attachments \
  --allow-root

# 3. Verifică
docker exec climaticpro-wordpress-1 wp post list --post_type=page --format=count --allow-root
docker exec climaticpro-wordpress-1 wp post list --post_type=post --format=count --allow-root

# 4. Fix URLs
docker exec climaticpro-wordpress-1 wp search-replace \
  'https://climaticpro.ro' \
  'https://cms.climaticpro.ro' \
  --allow-root

# 5. Flush cache
docker exec climaticpro-wordpress-1 wp cache flush --allow-root
docker exec climaticpro-wordpress-1 wp rewrite flush --allow-root

# 6. Reactivează mu-plugin
docker exec climaticpro-wordpress-1 mv \
  /var/www/html/wp-content/mu-plugins/disable-updates.php.bak \
  /var/www/html/wp-content/mu-plugins/disable-updates.php
```

---

**Gata! Import complet prin WP-CLI în 6 comenzi simple.** 🚀
