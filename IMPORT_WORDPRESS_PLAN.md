# Plan Import WordPress - ClimaticPRO

## 📋 Situația Actuală

### Ce avem:
- ✅ Frontend Next.js funcțional pe dev.climaticpro.ro
- ✅ Container WordPress existent (climaticpro-wordpress-1) - OPRIT
- ✅ Fișier export XML WordPress în `/frontend/docs/climaticpro.WordPress.2025-12-21.xml`
- ✅ Folder `uploads/` local cu imagini
- ✅ Folder `images/` local cu 118 imagini produse

### Ce trebuie:
- 🎯 WordPress funcțional pe cms.climaticpro.ro
- 🎯 Toate imaginile importate și accesibile
- 🎯 Baza de date cu produse WooCommerce
- 🎯 GraphQL API funcțional pentru frontend

---

## 🚀 Soluții Rapide Propuse

### **Opțiunea 1: Import Direct în WordPress Existent** ⭐ RECOMANDAT
**Timp estimat: 30-60 minute**

#### Pași:
1. **Pornire WordPress Container**
   ```bash
   cd /home/asns/projects/climaticpro
   docker-compose up -d wordpress
   ```

2. **Configurare Traefik pentru cms.climaticpro.ro**
   - Creare fișier `/home/asns/traefik/dynamic/climaticpro-cms.yml`
   - Configurare SSL cu httpresolver
   - Test accesibilitate

3. **Import Imagini în WordPress**
   ```bash
   # Copiere folder uploads în container
   docker cp ./uploads/ climaticpro-wordpress-1:/var/www/html/wp-content/
   
   # Copiere folder images (produse)
   docker cp ./images/ climaticpro-wordpress-1:/var/www/html/wp-content/uploads/
   
   # Fix permisiuni
   docker exec climaticpro-wordpress-1 chown -R www-data:www-data /var/www/html/wp-content/uploads
   ```

4. **Import Baza de Date**
   - Opțiune A: Import SQL direct în MariaDB
   - Opțiune B: Import XML via WordPress Importer plugin
   - Opțiune C: Import WooCommerce CSV

5. **Instalare Plugin-uri Necesare**
   ```bash
   docker exec climaticpro-wordpress-1 wp plugin install woocommerce --activate
   docker exec climaticpro-wordpress-1 wp plugin install wpgraphql --activate
   docker exec climaticpro-wordpress-1 wp plugin install wp-graphql-woocommerce --activate
   ```

6. **Configurare WooCommerce**
   - Setup wizard
   - Configurare categorii produse
   - Verificare produse importate

7. **Test GraphQL API**
   ```graphql
   query GetProducts {
     products(first: 10) {
       nodes {
         id
         name
         slug
         price
         image {
           sourceUrl
         }
       }
     }
   }
   ```

---

### **Opțiunea 2: WordPress Fresh Install**
**Timp estimat: 1-2 ore**

#### Pași:
1. Ștergere container vechi
2. Creare WordPress nou cu docker-compose
3. Instalare plugin-uri
4. Import XML complet
5. Import imagini
6. Configurare permalinks și setări

---

## 📦 Resurse Disponibile

### Fișiere Locale:
```
/home/asns/projects/climaticpro/
├── uploads/              # Imagini WordPress originale
│   ├── 2025/
│   ├── fonts/
│   └── rank-math/
├── images/               # 118 imagini produse (JPG, PNG, WEBP)
├── export/               # JSON exports
│   ├── products-clean.json
│   ├── products-no-images.json
│   ├── attributes.json
│   └── categories.json
└── frontend/docs/
    └── climaticpro.WordPress.2025-12-21.xml
```

### Container Info:
- **Container:** climaticpro-wordpress-1
- **Status:** Exited (oprit)
- **Image:** wordpress:6-apache
- **Network:** proxy (Traefik)

---

## 🎯 Recomandarea Mea

**Opțiunea 1** este cea mai rapidă și sigură:

### Avantaje:
✅ Container WordPress deja configurat
✅ Baza de date MariaDB existentă
✅ Configurare docker-compose gata
✅ Doar trebuie pornit și configurat

### Dezavantaje:
⚠️ Trebuie verificat ce date există deja
⚠️ Posibil conflict de date vechi

---

## 📝 Comenzi Utile

### Verificare Container WordPress:
```bash
# Status
docker ps -a | grep climaticpro-wordpress

# Loguri
docker logs climaticpro-wordpress-1 --tail 50

# Pornire
docker start climaticpro-wordpress-1

# Acces bash
docker exec -it climaticpro-wordpress-1 bash
```

### Verificare Bază de Date:
```bash
# Conectare la MariaDB
docker exec -it climaticpro-mariadb-1 mysql -u root -p

# Verificare baze de date
SHOW DATABASES;
USE climaticpro_db;
SHOW TABLES;
```

### WP-CLI în Container:
```bash
# Verificare instalare WordPress
docker exec climaticpro-wordpress-1 wp core version

# Lista plugin-uri
docker exec climaticpro-wordpress-1 wp plugin list

# Import XML
docker exec climaticpro-wordpress-1 wp import /path/to/file.xml --authors=create

# Regenerare thumbnails
docker exec climaticpro-wordpress-1 wp media regenerate --yes
```

---

## ⚡ Next Steps

1. **Confirmare abordare** - Care opțiune preferi?
2. **Verificare date existente** - Ce date sunt deja în WordPress?
3. **Backup** - Salvare date existente înainte de import
4. **Import** - Execuție pas cu pas
5. **Testare** - Verificare GraphQL și imagini
6. **Documentare** - Update configurație

---

## 🔗 URL-uri Finale

- **Frontend:** https://dev.climaticpro.ro
- **CMS:** https://cms.climaticpro.ro (de configurat)
- **GraphQL:** https://cms.climaticpro.ro/graphql
- **WP Admin:** https://cms.climaticpro.ro/wp-admin

---

## 📊 Estimare Timp Total

- Pornire WordPress: 5 min
- Configurare Traefik: 10 min
- Import imagini: 15 min
- Import bază de date: 20 min
- Instalare plugin-uri: 10 min
- Testare și verificare: 15 min

**TOTAL: ~75 minute**
