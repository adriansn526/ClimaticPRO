# Gestionare Bannere Hero - Recomandare

## 🎯 Întrebare

Cum gestionăm bannerele pentru Hero Section:
- **Opțiunea A:** ACF Gallery în Homepage
- **Opțiunea B:** CPT dedicat pentru bannere

---

## ✅ Recomandarea Mea: ACF Gallery în Homepage

### De Ce?

**Pentru ClimaticPro, ACF Gallery în Homepage este cea mai bună soluție:**

1. ✅ **Simplitate maximă** - Client editează direct în pagina Home
2. ✅ **Un singur slider** pe site (homepage)
3. ✅ **Ușor de folosit** - Upload imagini direct în galerie
4. ✅ **Implementare rapidă** - 10-15 minute
5. ✅ **Suficient** pentru nevoile actuale

---

## 📊 Comparație Detaliată

| Criteriu | ACF în Homepage | CPT Bannere |
|----------|----------------|-------------|
| **Simplitate** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Viteză implementare** | 10-15 min | 30-45 min |
| **UX Client** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Flexibilitate** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Reutilizabil** | ❌ (doar homepage) | ✅ (orice pagină) |
| **Complexitate** | Minimă | Medie |
| **Ideal pentru** | 1 slider | Multiple slidere |

---

## 🎯 Când să Folosești CPT?

**Folosește CPT "Bannere" DOAR dacă:**

1. ❓ Ai **multiple slidere** pe site (homepage, category pages, landing pages)
2. ❓ Vrei să **programezi** bannere (start date, end date)
3. ❓ Ai **zeci de bannere** și vrei organizare mai bună
4. ❓ Vrei **A/B testing** pentru bannere
5. ❓ Ai **echipă mare** care gestionează bannere

**Pentru ClimaticPro:** Nu ai nevoie de niciuna din acestea → **ACF în Homepage**

---

## 📦 Implementare ACF Gallery în Homepage

### Pas 1: Identifică Homepage ID

```bash
# Găsește homepage
docker exec climaticpro-wordpress-1 wp option get page_on_front --allow-root

# SAU caută manual
docker exec climaticpro-wordpress-1 wp post list --post_type=page --s="home" --allow-root
```

### Pas 2: Creează ACF Field Group

**În WordPress Admin:**

```
Custom Fields → Add New

Field Group Name: Homepage Banners
Location: Page is equal to Homepage (sau Page Template is equal to Default)

Field:
├── Label: Bannere Homepage
├── Name: bannere_homepage
├── Type: Gallery
├── Return Format: Array
├── Library: All
├── Min: 1
├── Max: 5
├── Preview Size: Medium

Settings:
└── Show in GraphQL: Yes
└── GraphQL Field Name: homepageBanners
```

### Pas 3: GraphQL Query

```graphql
query GetHomepageBanners {
  page(id: "/", idType: URI) {
    homepageBanners {
      bannereHomepage {
        sourceUrl
        altText
        title
        mediaDetails {
          width
          height
        }
      }
    }
  }
}
```

### Pas 4: Next.js Integration

**lib/wordpress.ts:**
```typescript
export interface Banner {
  sourceUrl: string;
  altText: string;
  title: string;
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
          bannereHomepage {
            sourceUrl
            altText
            title
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  `;
  
  const response = await fetch(process.env.NEXT_PUBLIC_WORDPRESS_API_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    next: { revalidate: 300 }, // ISR 5 minutes
  });
  
  const json = await response.json();
  return json.data?.page?.homepageBanners?.bannereHomepage || [];
}
```

**components/home/HeroSection.tsx:**
```typescript
interface HeroSectionProps {
  banners: Banner[];
}

export default function HeroSection({ banners }: HeroSectionProps) {
  // Fallback la imagini locale dacă WordPress nu returnează
  const defaultBanners = [
    { sourceUrl: '/banners/banner-1.jpg', altText: 'Banner 1' },
    { sourceUrl: '/banners/banner-2.jpg', altText: 'Banner 2' },
    { sourceUrl: '/banners/banner-3.jpg', altText: 'Banner 3' },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;
  
  // ... slider logic
}
```

**app/page.tsx:**
```typescript
export default async function HomePage() {
  const banners = await getHomepageBanners();
  
  return (
    <main>
      <HeroSection banners={banners} />
      {/* ... */}
    </main>
  );
}
```

---

## 🎨 Specificații Imagini Banner

**Dimensiuni:**
- Desktop: 1920x600px
- Mobile: 800x600px (crop automat)

**Format:**
- JPG (80-90% quality) pentru fotografii
- PNG pentru grafice cu transparență
- WebP pentru optimizare maximă

**Mărime:**
- < 200KB per imagine (optimizat)

---

## 🔄 Upgrade Path (Dacă Ai Nevoie Ulterior)

Dacă în viitor ai nevoie de CPT, poți migra ușor:

1. Creează CPT "Bannere"
2. Migrează imaginile din ACF Gallery la CPT
3. Update GraphQL query
4. Fără pierdere de date

---

## 💡 Recomandarea Finală

**Pentru ClimaticPro:**

✅ **Folosește ACF Gallery în Homepage**

**Motivație:**
- Un singur slider pe homepage
- Client vrea simplitate
- Implementare rapidă (10-15 min)
- Suficient pentru nevoile actuale
- Ușor de upgradat la CPT dacă e nevoie

**Nu complica lucrurile cu CPT dacă nu ai nevoie!**

---

## 📝 Next Steps

1. Identifică Homepage ID în WordPress
2. Creează ACF Field Group "Homepage Banners"
3. Adaugă field "Gallery" cu GraphQL enabled
4. Upload 3-5 imagini banner în homepage
5. Testează GraphQL query
6. Integrează în Next.js (cod gata mai sus)

**Timp estimat:** 15-20 minute pentru implementare completă

---

**Decizie:** ACF Gallery în Homepage = Simplu, Rapid, Suficient ✅
