# Banner Management Solution - ClimaticPro

## 🎯 Problema
Cum gestionăm imaginile pentru banner slider-ul de pe homepage?

## 💡 Soluții Posibile

### **Opțiunea 1: ACF în Pagina Home (RECOMANDAT) ⭐**

**Avantaje:**
- ✅ Simplu de implementat
- ✅ Ușor de folosit pentru client
- ✅ Editare directă în pagina Home
- ✅ Nu necesită CPT suplimentar
- ✅ Ideal pentru un singur slider pe site

**Dezavantaje:**
- ❌ Limitat la homepage
- ❌ Nu poate fi reutilizat pe alte pagini

**Implementare:**

1. **WordPress - ACF Setup:**
```php
// ACF Field Group: "Homepage Banners"
// Location: Page is equal to Homepage

Field Group: Homepage Banners
├── Field: banners (Gallery)
│   ├── Return Format: Array
│   ├── Library: All
│   ├── Min: 1
│   ├── Max: 5
│   └── Preview Size: Medium
```

2. **GraphQL Query:**
```graphql
query GetHomepageBanners {
  page(id: "homepage", idType: URI) {
    homepageBanners {
      banners {
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
    }
  }
}
```

3. **Next.js Integration:**
```typescript
// lib/wordpress.ts
export async function getHomepageBanners() {
  const query = `
    query GetHomepageBanners {
      page(id: "/", idType: URI) {
        homepageBanners {
          banners {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  `;
  
  const response = await fetch(WORDPRESS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  
  const json = await response.json();
  return json.data.page.homepageBanners.banners;
}

// components/home/HeroSection.tsx
const banners = await getHomepageBanners();
```

---

### **Opțiunea 2: Custom Post Type "Banners"**

**Avantaje:**
- ✅ Reutilizabil pe multiple pagini
- ✅ Poate avea multiple slidere (homepage, category pages, etc.)
- ✅ Mai organizat pentru multe bannere
- ✅ Poate avea taxonomii (categorii de bannere)

**Dezavantaje:**
- ❌ Mai complex de implementat
- ❌ Overkill pentru un singur slider
- ❌ Mai greu de folosit pentru client

**Implementare:**

1. **WordPress - CPT Setup:**
```php
// functions.php sau plugin
function register_banner_cpt() {
  register_post_type('banner', [
    'label' => 'Bannere',
    'public' => true,
    'show_in_graphql' => true,
    'graphql_single_name' => 'banner',
    'graphql_plural_name' => 'banners',
    'supports' => ['title', 'thumbnail'],
    'menu_icon' => 'dashicons-images-alt2',
  ]);
}
add_action('init', 'register_banner_cpt');

// ACF Fields pentru Banner CPT
Field Group: Banner Details
├── Field: link_url (URL)
├── Field: link_text (Text)
├── Field: order (Number)
└── Field: active (True/False)
```

2. **GraphQL Query:**
```graphql
query GetBanners {
  banners(first: 10, where: {orderby: {field: MENU_ORDER, order: ASC}}) {
    nodes {
      id
      title
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      bannerDetails {
        linkUrl
        linkText
        order
        active
      }
    }
  }
}
```

---

### **Opțiunea 3: ACF Options Page (Pentru Multiple Slidere)**

**Avantaje:**
- ✅ Centralizat într-o singură locație
- ✅ Poate avea multiple slidere (homepage, about, etc.)
- ✅ Ușor de accesat din orice pagină

**Dezavantaje:**
- ❌ Mai puțin intuitiv pentru client
- ❌ Necesită plugin ACF Pro

**Implementare:**

1. **WordPress - ACF Options:**
```php
// functions.php
if(function_exists('acf_add_options_page')) {
  acf_add_options_page([
    'page_title' => 'Setări Bannere',
    'menu_title' => 'Bannere',
    'menu_slug' => 'banner-settings',
    'capability' => 'edit_posts',
    'show_in_graphql' => true,
  ]);
}

// ACF Fields
Field Group: Banner Settings
├── Field: homepage_banners (Gallery)
├── Field: about_banners (Gallery)
└── Field: category_banners (Gallery)
```

---

## 🏆 Recomandarea Mea: **Opțiunea 1 - ACF în Pagina Home**

### De ce?

1. **Simplitate:** Client-ul editează direct în pagina Home
2. **Rapiditate:** Implementare în 15-20 minute
3. **Suficient:** Pentru un singur slider, nu ai nevoie de CPT
4. **Intuitiv:** Client-ul vede imediat unde să adauge bannere

### Când să folosești CPT?

- Dacă ai **multiple slidere** pe site (homepage, category pages, landing pages)
- Dacă vrei să **programezi** bannere (start date, end date)
- Dacă ai **sute de bannere** și vrei organizare mai bună
- Dacă vrei **A/B testing** pentru bannere

---

## 📋 Pași Implementare (Opțiunea 1 - ACF)

### 1. WordPress Setup

**Instalare Plugin:**
```bash
# În WordPress Admin
Plugins → Add New → "Advanced Custom Fields"
Activate
```

**Creare Field Group:**
```
ACF → Field Groups → Add New

Title: Homepage Banners
Location: Page is equal to Homepage

Fields:
├── banners
    ├── Field Type: Gallery
    ├── Return Format: Array
    ├── Library: All
    ├── Min: 1
    ├── Max: 5
    ├── Preview Size: Medium
```

**Activare GraphQL:**
```
ACF → Field Groups → Homepage Banners
└── Settings → Show in GraphQL: Yes
└── GraphQL Field Name: homepageBanners
```

### 2. WPGraphQL for ACF

**Instalare:**
```bash
Plugins → Add New → "WPGraphQL for Advanced Custom Fields"
Activate
```

### 3. Next.js Integration

**lib/wordpress.ts:**
```typescript
export interface Banner {
  sourceUrl: string;
  altText: string;
  mediaDetails: {
    width: number;
    height: number;
  };
}

export async function getHomepageBanners(): Promise<Banner[]> {
  const query = `
    query GetHomepageBanners {
      page(id: "/", idType: URI) {
        homepageBanners {
          banners {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  `;
  
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_WORDPRESS_API_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 }, // ISR 5 minutes
    });
    
    const json = await response.json();
    return json.data?.page?.homepageBanners?.banners || [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}
```

**components/home/HeroSection.tsx:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface Banner {
  sourceUrl: string;
  altText: string;
  mediaDetails: {
    width: number;
    height: number;
  };
}

interface HeroSectionProps {
  banners: Banner[];
}

export default function HeroSection({ banners }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fallback dacă nu sunt bannere
  const defaultBanners = [
    { sourceUrl: '/banners/banner-1.jpg', altText: 'Banner 1' },
    { sourceUrl: '/banners/banner-2.jpg', altText: 'Banner 2' },
    { sourceUrl: '/banners/banner-3.jpg', altText: 'Banner 3' },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayBanners.length]);

  // ... rest of component
}
```

**app/page.tsx:**
```typescript
import { getHomepageBanners } from '@/lib/wordpress';
import HeroSection from '@/components/home/HeroSection';

export default async function HomePage() {
  const banners = await getHomepageBanners();
  
  return (
    <main className="min-h-screen">
      <HeroSection banners={banners} />
      {/* ... rest of page */}
    </main>
  );
}
```

---

## 🎨 Specificații Imagini Banner

**Dimensiuni Recomandate:**
- Desktop: 1920x600px
- Mobile: 800x600px (responsive crop)

**Format:**
- JPG pentru fotografii (80-90% quality)
- PNG pentru grafice cu transparență
- WebP pentru optimizare maximă

**Optimizare:**
- Compresie: < 200KB per imagine
- Lazy loading: Doar primul banner cu `priority`
- Next.js Image component: Optimizare automată

---

## 📊 Comparație Finală

| Criteriu | ACF Homepage | CPT Banners | ACF Options |
|----------|-------------|-------------|-------------|
| Simplitate | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Flexibilitate | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| UX Client | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Timp Implementare | 15-20 min | 45-60 min | 30-40 min |
| Reutilizabil | ❌ | ✅ | ✅ |
| Scalabil | ❌ | ✅ | ⭐⭐⭐ |

---

## ✅ Decizie Finală

**Pentru ClimaticPro:** Folosim **ACF în Pagina Home**

**Motivație:**
- Un singur slider pe homepage
- Client vrea simplitate
- Implementare rapidă
- Suficient pentru nevoile actuale

**Upgrade Path:**
Dacă în viitor ai nevoie de multiple slidere, poți migra la CPT fără să pierzi datele.

---

## 🚀 Next Steps

1. ✅ Instalare ACF în WordPress
2. ✅ Creare field group "Homepage Banners"
3. ✅ Instalare WPGraphQL for ACF
4. ✅ Testare query GraphQL
5. ✅ Implementare în Next.js
6. ✅ Upload 3-5 imagini banner în WordPress
7. ✅ Testare slider pe frontend

**Timp estimat:** 20-30 minute
