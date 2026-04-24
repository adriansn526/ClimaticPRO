# WordPress ACF Setup - Bannere Homepage ClimaticPro

## 📋 Pași Implementare

### 1. Creare Field Group în ACF

**Accesează:** WordPress Admin → Custom Fields → Add New

**Configurare Field Group:**

```
Field Group Name: Homepage Banners
Description: Galerie imagini pentru banner slider homepage

Location Rules:
└── Show this field group if
    └── Page is equal to Homepage (sau Page Template is equal to Default Template)

Settings:
└── Active: Yes
└── Show in GraphQL: Yes
└── GraphQL Field Name: homepageBanners
```

---

### 2. Adăugare Field "Bannere"

**În Field Group "Homepage Banners", adaugă următorul field:**

```
Field Label: Bannere Homepage
Field Name: banners
Field Type: Gallery

Gallery Settings:
├── Return Format: Array
├── Library: All
├── Minimum Selection: 1
├── Maximum Selection: 5
├── Insert: Append to the end
├── Preview Size: Medium (300x300)

Validation:
└── Required: Yes (opțional)

Presentation:
├── Instructions: Adaugă 3-5 imagini pentru banner slider (1920x600px recomandat)
└── Wrapper Width: 100%

GraphQL Settings:
└── Show in GraphQL: Yes
└── GraphQL Field Name: banners
```

---

### 3. Configurare GraphQL pentru ACF

**Verifică că ai instalat:**
- ✅ WPGraphQL (plugin principal)
- ✅ WPGraphQL for Advanced Custom Fields

**Activare GraphQL pentru Field Group:**

```
În Field Group "Homepage Banners":
└── Settings (tab)
    └── Show in GraphQL: Yes
    └── GraphQL Field Name: homepageBanners
```

**Activare GraphQL pentru Field "banners":**

```
În Field "Bannere Homepage":
└── GraphQL (tab sau secțiune)
    └── Show in GraphQL: Yes
    └── GraphQL Field Name: banners
```

---

### 4. Upload Imagini Banner

**Accesează:** Pages → Homepage → Edit

**Scroll la secțiunea "Homepage Banners":**

1. Click pe "Add Images"
2. Upload 3-5 imagini (sau selectează din Media Library)
3. Recomandări imagini:
   - Dimensiune: 1920x600px
   - Format: JPG (80-90% quality)
   - Mărime: < 200KB per imagine
   - Aspect ratio: 16:5

4. Click "Update" pentru a salva pagina

---

### 5. Testare GraphQL Query

**Accesează:** https://cms.climaticpro.ro/graphql

**Query de test:**

```graphql
query GetHomepageBanners {
  page(id: "/", idType: URI) {
    id
    title
    homepageBanners {
      banners {
        id
        sourceUrl
        altText
        title
        mediaDetails {
          width
          height
          file
        }
      }
    }
  }
}
```

**Răspuns așteptat:**

```json
{
  "data": {
    "page": {
      "id": "cG9zdDox",
      "title": "Homepage",
      "homepageBanners": {
        "banners": [
          {
            "id": "YXR0YWNobWVudDo1",
            "sourceUrl": "https://cms.climaticpro.ro/wp-content/uploads/2025/12/banner-1.jpg",
            "altText": "Banner 1",
            "title": "Banner 1",
            "mediaDetails": {
              "width": 1920,
              "height": 600,
              "file": "2025/12/banner-1.jpg"
            }
          },
          {
            "id": "YXR0YWNobWVudDo2",
            "sourceUrl": "https://cms.climaticpro.ro/wp-content/uploads/2025/12/banner-2.jpg",
            "altText": "Banner 2",
            "title": "Banner 2",
            "mediaDetails": {
              "width": 1920,
              "height": 600,
              "file": "2025/12/banner-2.jpg"
            }
          }
        ]
      }
    }
  }
}
```

---

### 6. Integrare Next.js

**Fișier:** `/lib/wordpress.ts`

```typescript
export interface Banner {
  id: string;
  sourceUrl: string;
  altText: string;
  title: string;
  mediaDetails: {
    width: number;
    height: number;
    file: string;
  };
}

export async function getHomepageBanners(): Promise<Banner[]> {
  const query = `
    query GetHomepageBanners {
      page(id: "/", idType: URI) {
        homepageBanners {
          banners {
            id
            sourceUrl
            altText
            title
            mediaDetails {
              width
              height
              file
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
    
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }
    
    return json.data?.page?.homepageBanners?.banners || [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}
```

**Fișier:** `/components/home/HeroSection.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NextImage from 'next/image';

interface Banner {
  id: string;
  sourceUrl: string;
  altText: string;
  title: string;
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

  // Fallback la imagini locale dacă nu sunt bannere din WordPress
  const defaultBanners = [
    { 
      id: '1',
      sourceUrl: '/banners/banner-1.jpg', 
      altText: 'Banner 1',
      title: 'Banner 1',
      mediaDetails: { width: 1920, height: 600 }
    },
    { 
      id: '2',
      sourceUrl: '/banners/banner-2.jpg', 
      altText: 'Banner 2',
      title: 'Banner 2',
      mediaDetails: { width: 1920, height: 600 }
    },
    { 
      id: '3',
      sourceUrl: '/banners/banner-3.jpg', 
      altText: 'Banner 3',
      title: 'Banner 3',
      mediaDetails: { width: 1920, height: 600 }
    },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayBanners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-100">
      {/* Banner Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            <NextImage
              src={displayBanners[currentSlide].sourceUrl}
              alt={displayBanners[currentSlide].altText || displayBanners[currentSlide].title}
              fill
              className="object-cover"
              priority={currentSlide === 0}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {displayBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
```

**Fișier:** `/app/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server';
import { getHomepageBanners } from '@/lib/wordpress';
import HeroSection from '@/components/home/HeroSection';
import TrustBadges from '@/components/home/TrustBadges';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import ServicesSection from '@/components/home/ServicesSection';
import WhyChooseSection from '@/components/home/WhyChooseSection';
import FinalCTA from '@/components/home/FinalCTA';

export async function generateMetadata() {
  const t = await getTranslations({ locale: 'ro', namespace: 'hero' });

  return {
    title: `${t('title')} | ClimaticPro - Gree, Daikin, Midea`,
    description: t('subtitle'),
    keywords: 'aer conditionat, instalare aer conditionat, gree, daikin, midea, bucuresti, climatizare',
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      type: 'website',
      locale: 'ro_RO',
    },
  };
}

export default async function HomePage() {
  const banners = await getHomepageBanners();
  
  return (
    <main className="min-h-screen">
      <HeroSection banners={banners} />
      <TrustBadges />
      <CategoriesGrid />
      <ServicesSection />
      <WhyChooseSection />
      <FinalCTA />
    </main>
  );
}
```

---

## 🔧 Troubleshooting

### Problema: GraphQL query returnează null

**Verifică:**
1. Field Group "Homepage Banners" are "Show in GraphQL: Yes"
2. Field "banners" are "Show in GraphQL: Yes"
3. GraphQL Field Name este "homepageBanners" (camelCase)
4. Ai salvat pagina Homepage cu imagini în galerie

### Problema: Imagini nu se afișează

**Verifică:**
1. URL-urile imaginilor sunt corecte în GraphQL response
2. Next.js config permite domeniul WordPress în `remotePatterns`
3. Imaginile sunt publice (nu draft)

### Problema: ACF field nu apare în GraphQL

**Soluție:**
1. Reinstalează "WPGraphQL for Advanced Custom Fields"
2. Verifică că field group are location rule corectă
3. Flush GraphQL schema: Settings → GraphQL → "Flush Cache"

---

## ✅ Checklist Final

- [ ] ACF instalat și activat
- [ ] WPGraphQL instalat și activat
- [ ] WPGraphQL for ACF instalat și activat
- [ ] Field Group "Homepage Banners" creat
- [ ] Field "banners" (Gallery) adăugat
- [ ] GraphQL activat pentru field group și field
- [ ] 3-5 imagini uploadate în galeria homepage
- [ ] GraphQL query testată și funcționează
- [ ] Cod Next.js implementat
- [ ] Bannere vizibile pe frontend

---

**Timp estimat:** 15-20 minute  
**Dificultate:** Ușoară  
**Rezultat:** Sistem complet funcțional de management bannere
