# Problema WordPress UI - Redirect la Dashboard

## 🚨 Problema Identificată

**Simptom:** Când încerci să activezi orice plugin prin WordPress Admin UI, ești redirectat la dashboard în loc să se activeze plugin-ul.

**Cauză:** Există un hook sau filter în WordPress care interceptează acțiunea de activare plugin și face redirect la dashboard.

---

## ✅ Soluția: Folosește WP-CLI

**WP-CLI funcționează perfect!**

```bash
# WP All Import s-a activat cu succes
docker exec climaticpro-wordpress-1 wp plugin activate wp-all-import --allow-root
# Success: Activated 1 of 1 plugins.
```

**Concluzie:** Problema este DOAR în UI, nu în WordPress în sine.

---

## 🔍 Posibile Cauze

### 1. **Security Plugin sau Firewall**

Unele plugin-uri de securitate blochează activarea plugin-urilor prin UI pentru a preveni atacuri.

**Verificare:**
```bash
docker exec climaticpro-wordpress-1 wp plugin list --status=active --allow-root | grep -iE "security|firewall|wordfence|sucuri"
```

### 2. **Redirect Hook în Theme sau Plugin**

Un theme sau plugin poate avea un hook care face redirect:
```php
add_action('admin_init', function() {
    if (isset($_GET['action']) && $_GET['action'] === 'activate') {
        wp_redirect(admin_url());
        exit;
    }
});
```

### 3. **Permissions Issue**

User-ul WordPress nu are permisiuni să activeze plugin-uri prin UI.

**Verificare:**
```bash
docker exec climaticpro-wordpress-1 wp user list --allow-root
docker exec climaticpro-wordpress-1 wp user get 1 --allow-root
```

### 4. **Caching Issue**

Redis cache sau OPcache poate cauza probleme.

**Fix:**
```bash
docker exec climaticpro-wordpress-1 wp cache flush --allow-root
docker exec climaticpro-wordpress-1 wp rewrite flush --allow-root
```

---

## 🎯 Workaround: Activează Toate Plugin-urile prin WP-CLI

```bash
# Activează WordPress Importer
docker exec climaticpro-wordpress-1 wp plugin activate wordpress-importer --allow-root

# Activează WP All Import (deja activat)
docker exec climaticpro-wordpress-1 wp plugin activate wp-all-import --allow-root

# Verifică status
docker exec climaticpro-wordpress-1 wp plugin list --allow-root
```

---

## 📋 Status Actual

**Plugin-uri Active:**
- ✅ WP All Import (activat prin WP-CLI)
- ✅ WooCommerce
- ✅ WPGraphQL
- ✅ ACF Pro
- ✅ Rank Math
- ✅ Redis Cache

**Plugin-uri Inactive:**
- ❌ WordPress Importer (nu se activează nici prin WP-CLI din cauza incompatibilității PHP 8.3)
- ❌ Akismet
- ❌ Hello Dolly

---

## 💡 Recomandare

**NU mai încerca să activezi plugin-uri prin UI** - folosește WP-CLI:

```bash
# Template pentru activare plugin
docker exec climaticpro-wordpress-1 wp plugin activate NUME-PLUGIN --allow-root
```

**Pentru import, folosește WP All Import care este ACTIV:**
```
https://cms.climaticpro.ro/wp-admin/admin.php?page=pmxi-admin-import
```

---

## 🔧 Fix Permanent (Opțional)

Dacă vrei să rezolvi problema de redirect, trebuie să:

1. **Dezactivează toate plugin-urile:**
```bash
docker exec climaticpro-wordpress-1 wp plugin deactivate --all --allow-root
```

2. **Activează unul câte unul pentru a identifica cauza:**
```bash
docker exec climaticpro-wordpress-1 wp plugin activate woocommerce --allow-root
# Testează UI
docker exec climaticpro-wordpress-1 wp plugin activate wp-graphql --allow-root
# Testează UI
# etc.
```

3. **Verifică theme:**
```bash
docker exec climaticpro-wordpress-1 wp theme list --allow-root
```

---

## 🎯 Concluzie

**WordPress-ul tău funcționează perfect prin WP-CLI.**

Problema de redirect în UI este probabil cauzată de:
- Un plugin de securitate
- Un hook în theme
- O setare de permisiuni

**Soluția imediată:** Folosește WP-CLI pentru toate operațiunile admin.

**Pentru import:** WP All Import este ACTIV și funcțional - accesează-l direct în browser.
