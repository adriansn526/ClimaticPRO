# 🎨 Sistem Management Bannere ClimaticPRO

## ✅ Status Implementare: COMPLET

Implementat prin **WP-CLI** - CPT + ACF + GraphQL

---

## 📋 Componente Implementate

### **1. Plugin WordPress: ClimaticPRO Bannere Manager**
**Locație:** `/wp-content/plugins/climaticpro-bannere/`

**Features:**
- ✅ Custom Post Type "bannere" cu GraphQL support
- ✅ Coloane custom în admin (Locație, Activ, Ordine)
- ✅ Sortare după ordine și status
- ✅ Flush rewrite rules la activare/dezactivare
- ✅ Icon personalizat în meniu (dashicons-images-alt2)

**Status:** ✅ Activat și funcțional

---

### **2. ACF Field Group: Banner Settings**
**Locație:** `/wp-content/plugins/climaticpro-bannere/acf-json/group_bannere_settings.json`

**13 Câmpuri Configurate:**

| Câmp | Tip | GraphQL Name | Descriere |
|------|-----|--------------|-----------|
| **Locație Banner** | Select | `locatie` | Unde se afișează bannerul |
| **Imagine Desktop** | Image | `imagineDesktop` | Min 1920x600px |
| **Imagine Mobile** | Image | `imagineMobile` | Min 768x600px |
| **Titlu Banner** | Text | `titluBanner` | Titlu afișat (opțional) |
| **Subtitlu Banner** | Textarea | `subtitluBanner` | Descriere scurtă |
| **CTA Text** | Text | `ctaText` | Text buton |
| **CTA Link** | URL | `ctaLink` | URL buton |
| **CTA Style** | Select | `ctaStyle` | primary/secondary/success/danger |
| **Ordine Afișare** | Number | `ordine` | 0-100 |
| **Banner Activ** | True/False | `activ` | On/Off |
| **Data Start** | Date Picker | `dataStart` | Data activare |
| **Data Sfârșit** | Date Picker | `dataSfarsit` | Data expirare |
| **Target Blank** | True/False | `targetBlank` | Tab nou |

**Locații Disponibile:**
- `homepage_hero` - Homepage - Hero Section
- `homepage_categories` - Homepage - Categorii
- `homepage_featured` - Homepage - Produse Recomandate
- `produse_hero` - Produse - Hero
- `produse_sidebar` - Produse - Sidebar
- `produs_single` - Produs Single - Banner
- `footer_promo` - Footer - Promoțional
- `popup_promotional` - Popup Promoțional

**Status:** ✅ Importat și funcțional în WordPress

---

### **3. Frontend Helper: bannere.ts**
**Locație:** `/frontend/lib/bannere.ts`

**Funcții Disponibile:**

#### **`getBannereByLocatie(locatie, limit)`**
Obține bannere filtrate după locație.

```typescript
const banners = await getBannereByLocatie('homepage_hero', 5);
```

**Features:**
- ✅ Filtrare după locație
- ✅ Verificare status activ
- ✅ Verificare date start/sfârșit
- ✅ Sortare după ordine
- ✅ Cache 5 minute (ISR)

#### **`getAllBannere(limit)`**
Obține toate bannerele active.

```typescript
const allBanners = await getAllBannere(50);
```

**Status:** ✅ Implementat și testat

---

## 🚀 Utilizare în Frontend

### **Exemplu 1: Homepage Hero**
```typescript
// app/page.tsx
import { getBannereByLocatie } from '@/lib/bannere';

export default async function HomePage() {
  const heroBanners = await getBannereByLocatie('homepage_hero', 3);
  
  return (
    <main>
      <HeroSection banners={heroBanners} />
    </main>
  );
}
```

### **Exemplu 2: Produse Sidebar**
```typescript
// app/produse/page.tsx
import { getBannereByLocatie } from '@/lib/bannere';

export default async function ProdusePage() {
  const sidebarBanners = await getBannereByLocatie('produse_sidebar', 2);
  
  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-3">
        {/* Produse */}
      </div>
      <aside>
        <BannerSidebar banners={sidebarBanners} />
      </aside>
    </div>
  );
}
```

### **Exemplu 3: Popup Promoțional**
```typescript
// components/PromoPopup.tsx
'use client';

import { useEffect, useState } from 'react';
import { getBannereByLocatie } from '@/lib/bannere';

export default function PromoPopup() {
  const [banner, setBanner] = useState(null);
  
  useEffect(() => {
    getBannereByLocatie('popup_promotional', 1).then(banners => {
      if (banners.length > 0) setBanner(banners[0]);
    });
  }, []);
  
  if (!banner) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      {/* Popup content */}
    </div>
  );
}
```

---

## 📊 GraphQL Queries

### **Query Simplă**
```graphql
query GetBannere {
  bannere(first: 10) {
    nodes {
      id
      title
      bannerSettings {
        locatie
        activ
        ordine
        ctaText
        ctaLink
      }
    }
  }
}
```

### **Query Completă cu Imagini**
```graphql
query GetBannereComplete {
  bannere(first: 10) {
    nodes {
      id
      title
      bannerSettings {
        locatie
        imagineDesktop {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
        imagineMobile {
          sourceUrl
          altText
        }
        titluBanner
        subtitluBanner
        ctaText
        ctaLink
        ctaStyle
        ordine
        activ
        dataStart
        dataSfarsit
        targetBlank
      }
    }
  }
}
```

### **Test GraphQL**
```bash
curl -s https://cms.climaticpro.ro/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ bannere(first: 5) { nodes { id title bannerSettings { locatie activ } } } }"}' \
  | python3 -m json.tool
```

---

## 🎯 Workflow Adăugare Banner Nou

### **1. În WordPress Admin**
1. Accesează **Bannere → Adaugă Banner**
2. Completează **Titlu** (ex: "Promoție Vară 2025")
3. Selectează **Locație** (ex: "Homepage - Hero Section")
4. Upload **Imagine Desktop** (min 1920x600px)
5. Upload **Imagine Mobile** (opțional, min 768x600px)
6. Completează **CTA Text** (ex: "Vezi Oferta")
7. Completează **CTA Link** (ex: "/produse?promo=vara")
8. Setează **Ordine** (0 = primul)
9. Bifează **Banner Activ**
10. (Opțional) Setează **Data Start** și **Data Sfârșit**
11. Click **Publish**

### **2. În Frontend**
Bannerul va apărea automat în locația selectată după următoarea revalidare (max 5 minute).

**Forțare Revalidare:**
```bash
# Restart Next.js dev server
pm2 restart climaticpro-dev
```

---

## 🔧 Comenzi WP-CLI Utile

### **Creare Banner prin CLI**
```bash
# Creare banner
wp post create \
  --post_type=bannere \
  --post_title="Banner Promoție" \
  --post_status=publish

# Setare meta fields
wp post meta update POST_ID locatie "homepage_hero"
wp post meta update POST_ID activ "1"
wp post meta update POST_ID ordine "0"
wp post meta update POST_ID cta_text "Vezi Oferta"
wp post meta update POST_ID cta_link "/produse"
```

### **Listare Bannere**
```bash
wp post list --post_type=bannere --format=table
```

### **Ștergere Bannere Inactive**
```bash
wp post delete $(wp post list --post_type=bannere --post_status=draft --format=ids) --force
```

---

## 📈 Statistici Implementare

| Aspect | Detalii |
|--------|---------|
| **Timp Implementare** | ~30 minute (prin WP-CLI) |
| **Linii Cod** | ~500 linii (PHP + TypeScript + JSON) |
| **Câmpuri ACF** | 13 câmpuri configurate |
| **Locații Disponibile** | 8 locații predefinite |
| **GraphQL Queries** | 2 funcții helper |
| **Cache** | 5 minute (ISR Next.js) |
| **Status** | ✅ Production Ready |

---

## 🎨 Componente UI Recomandate

### **BannerCarousel.tsx**
```typescript
'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '@/lib/bannere';

interface BannerCarouselProps {
  banners: Banner[];
  autoplay?: boolean;
  interval?: number;
}

export default function BannerCarousel({ 
  banners, 
  autoplay = true, 
  interval = 5000 
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Implementation...
  
  return (
    <div className="relative">
      {/* Carousel content */}
    </div>
  );
}
```

### **BannerSidebar.tsx**
```typescript
import NextImage from 'next/image';
import Link from 'next/link';
import { Banner } from '@/lib/bannere';

interface BannerSidebarProps {
  banners: Banner[];
}

export default function BannerSidebar({ banners }: BannerSidebarProps) {
  return (
    <div className="space-y-4">
      {banners.map(banner => (
        <Link 
          key={banner.id} 
          href={banner.bannerSettings.ctaLink || '#'}
          target={banner.bannerSettings.targetBlank ? '_blank' : '_self'}
        >
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            <NextImage
              src={banner.bannerSettings.imagineDesktop?.sourceUrl || ''}
              alt={banner.bannerSettings.imagineDesktop?.altText || banner.title}
              fill
              className="object-cover"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
```

---

## 🔐 Securitate & Permisiuni

**Roluri WordPress cu Acces:**
- Administrator: Full access
- Editor: Create, edit, delete bannere
- Author: Create, edit own bannere
- Contributor: Create bannere (pending review)

**GraphQL Public Access:**
- ✅ Read-only pentru bannere active
- ❌ Nu se pot crea/edita bannere prin GraphQL

---

## 📝 TODO Viitor (Opțional)

- [ ] Analytics tracking pentru click-uri bannere
- [ ] A/B testing pentru variante bannere
- [ ] Lazy loading pentru imagini bannere
- [ ] Preload pentru bannere hero
- [ ] Bannere video support
- [ ] Bannere interactive (hover effects)
- [ ] Export/Import bannere între medii

---

## ✅ Checklist Implementare

- [x] Plugin ClimaticPRO Bannere creat
- [x] CPT "bannere" înregistrat cu GraphQL
- [x] ACF Field Group configurat (13 câmpuri)
- [x] ACF Field Group importat în WordPress
- [x] Plugin activat prin WP-CLI
- [x] Banner de test creat
- [x] GraphQL query testat cu succes
- [x] Frontend helper `bannere.ts` creat
- [x] TypeScript interfaces definite
- [x] Documentație completă

---

## 🎉 Rezultat Final

**Sistem complet funcțional de management bannere:**
- ✅ **WordPress Admin:** UI intuitiv pentru gestionare bannere
- ✅ **GraphQL API:** Expunere automată bannere cu toate câmpurile
- ✅ **Frontend Helper:** Funcții TypeScript pentru fetch bannere
- ✅ **Filtrare Avansată:** După locație, status, date
- ✅ **Cache Optimizat:** ISR 5 minute pentru performanță
- ✅ **Production Ready:** Gata de utilizare în producție

**Data Implementare:** 26 Decembrie 2025
**Implementat prin:** WP-CLI + ACF Pro + GraphQL
**Status:** ✅ COMPLET și FUNCȚIONAL
