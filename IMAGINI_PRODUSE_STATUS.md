# Status Imagini Produse - ClimaticPRO

## ✅ Configurare Completă

### **WordPress Headless CMS:**
- **URL:** https://cms.climaticpro.ro
- **Imagini:** 603MB extrase în `/var/www/climaticpro-local/wp-content/uploads/`
- **Produse:** 82 produse cu imagini asociate
- **GraphQL API:** Funcțional cu câmp `image { sourceUrl altText }`

### **Frontend Next.js:**
- **URL:** https://dev.climaticpro.ro
- **Server:** PM2 persistent (restartat)
- **Next.js Image:** Configurat pentru `cms.climaticpro.ro`

---

## 📋 Componente cu Imagini Reale

### **1. Homepage - Produse Recomandate**
**Component:** `/frontend/components/products/FeaturedProducts.tsx`
- ✅ Folosește `ProductCard` pentru fiecare produs
- ✅ Query GraphQL include `image { sourceUrl altText }`

**Component:** `/frontend/components/products/ProductCard.tsx`
```typescript
const productImage = product.image?.sourceUrl || '/images/product-placeholder.svg';

<NextImage
  src={productImage}
  alt={product.image?.altText || product.name}
  fill
  className="object-contain p-4"
/>
```

### **2. Single Product Page**
**Component:** `/frontend/app/produse/[slug]/page.tsx`
- ✅ Folosește `ProductGallery` pentru imagini
- ✅ Include `product.image` + `product.galleryImages`

**Component:** `/frontend/components/products/ProductGallery.tsx`
```typescript
const galleryImages = [
  ...(product.image ? [product.image] : []),
  ...(product.galleryImages?.nodes || []),
];
```

---

## 🔧 Configurare Next.js Image

**File:** `/frontend/next.config.ts`
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'cms.climaticpro.ro',
      pathname: '/wp-content/uploads/**',
    },
  ],
}
```

---

## 🧪 Testare

### **Test GraphQL API - Imagini Produse:**
```bash
curl -s https://cms.climaticpro.ro/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 3) { nodes { id name image { sourceUrl } } } }"}'
```

**Rezultat Așteptat:**
```json
{
  "data": {
    "products": {
      "nodes": [
        {
          "id": "...",
          "name": "Aparat de aer conditionat...",
          "image": {
            "sourceUrl": "https://cms.climaticpro.ro/wp-content/uploads/2025/05/..."
          }
        }
      ]
    }
  }
}
```

### **Test Frontend - Homepage:**
1. Accesează: https://dev.climaticpro.ro
2. Scroll la secțiunea "Produse Recomandate"
3. Verifică că produsele afișează imagini reale (nu placeholder)

### **Test Frontend - Single Product:**
1. Accesează un produs: https://dev.climaticpro.ro/produse/[slug]
2. Verifică galeria de imagini
3. Verifică că imaginile se încarcă de pe `cms.climaticpro.ro`

---

## 📊 Exemple URL Imagini

Produsele au imagini precum:
- `https://cms.climaticpro.ro/wp-content/uploads/2025/05/front-xtreme-fresh-550x550-1.jpg`
- `https://cms.climaticpro.ro/wp-content/uploads/2025/05/1708857716_Midea-Xtreme-Fresh-aerconditionatvanzari1.jpg`

---

## 🔍 Verificare Rapidă

### **1. Verificare WordPress - Produse cu Imagini:**
```bash
mysql -u climaticpro_wp -pXWBTMMTF0KWTEp7wVzrY climaticpro_wp -e \
  "SELECT p.ID, p.post_title, pm.meta_value as thumbnail_id 
   FROM cmp_postmeta pm 
   INNER JOIN cmp_posts p ON pm.post_id = p.ID 
   WHERE pm.meta_key = '_thumbnail_id' AND p.post_type = 'product' 
   LIMIT 5;"
```

### **2. Verificare GraphQL API:**
```bash
curl -s https://cms.climaticpro.ro/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 1) { nodes { name image { sourceUrl } } } }"}' \
  | python3 -m json.tool
```

### **3. Verificare Frontend:**
```bash
# Check homepage
curl -s https://dev.climaticpro.ro | grep -o "cms.climaticpro.ro/wp-content/uploads" | head -5

# Check if images load
curl -I https://cms.climaticpro.ro/wp-content/uploads/2025/05/front-xtreme-fresh-550x550-1.jpg
```

---

## ✅ Status Final

**Totul este configurat corect pentru afișarea imaginilor reale:**
- ✅ WordPress CMS cu 82 produse + imagini
- ✅ GraphQL API returnează URL-uri imagini
- ✅ Frontend Next.js configurat pentru domeniul WordPress
- ✅ Componente folosesc `product.image.sourceUrl`
- ✅ Server PM2 restartat pentru aplicare modificări

**Imaginile ar trebui să se afișeze automat pe:**
- Homepage: Secțiunea "Produse Recomandate"
- Single Product Page: Galerie imagini produse

---

## 🚀 Dacă Imaginile Nu Apar

### **1. Verifică Console Browser:**
```javascript
// Deschide DevTools (F12) și verifică Console pentru erori Next.js Image
// Caută erori de tipul: "Invalid src prop"
```

### **2. Verifică Network Tab:**
```
// Verifică dacă request-urile către cms.climaticpro.ro/wp-content/uploads/ 
// returnează 200 OK sau erori 403/404
```

### **3. Clear Cache Next.js:**
```bash
cd /home/asns/projects/climaticpro/frontend
rm -rf .next
pm2 restart climaticpro-dev
```

### **4. Verifică Permisiuni Imagini:**
```bash
ls -la /var/www/climaticpro-local/wp-content/uploads/2025/05/ | head -10
# Ar trebui să fie www-data:www-data
```

---

**Data:** 26 Decembrie 2025
**Status:** ✅ COMPLET - Imagini configurate și gata de afișare
