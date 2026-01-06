/**
 * Brand images mapping from WordPress termmeta (imagine_brand)
 * Maps brand term IDs and slugs to their image URLs from WordPress
 */

export interface BrandImageInfo {
  name: string;
  slug: string;
  imageUrl?: string;
  termId?: number;
}

// Mapping from WordPress database - cmp_termmeta where meta_key = 'imagine_brand'
export const BRAND_IMAGES: Record<string, BrandImageInfo> = {
  // Midea - term_id: 22, image_id: 8898
  'aer-conditionat-midea': {
    name: 'Midea',
    slug: 'aer-conditionat-midea',
    imageUrl: 'https://cms.climaticpro.ro/wp-content/uploads/2022/03/logo-midea.png',
    termId: 22,
  },
  'midea': {
    name: 'Midea',
    slug: 'aer-conditionat-midea',
    imageUrl: 'https://cms.climaticpro.ro/wp-content/uploads/2022/03/logo-midea.png',
    termId: 22,
  },
  
  // Daikin - term_id: 483, image_id: 11752
  'daikin': {
    name: 'DAIKIN',
    slug: 'daikin',
    imageUrl: 'https://cms.climaticpro.ro/wp-content/uploads/2025/03/Daikin-Logo1.png',
    termId: 483,
  },
  
  // Gree - no image in DB, will show text
  'aer-conditionat-gree': {
    name: 'Gree',
    slug: 'aer-conditionat-gree',
    termId: 80,
  },
  'gree': {
    name: 'Gree',
    slug: 'aer-conditionat-gree',
    termId: 80,
  },
  
  // Other brands without images
  'samsung': {
    name: 'Samsung',
    slug: 'samsung',
    termId: 58,
  },
  'fujitsu': {
    name: 'Fujitsu',
    slug: 'fujitsu',
    termId: 459,
  },
  'hyundai': {
    name: 'Hyundai',
    slug: 'hyundai',
    termId: 36,
  },
};

/**
 * Get brand image info by slug or name
 */
export function getBrandImage(brandSlugOrName: string): BrandImageInfo | null {
  const normalized = brandSlugOrName.toLowerCase().trim();
  
  // Direct slug match
  if (BRAND_IMAGES[normalized]) {
    return BRAND_IMAGES[normalized];
  }
  
  // Try to find by name
  for (const [key, info] of Object.entries(BRAND_IMAGES)) {
    if (info.name.toLowerCase() === normalized || info.slug === normalized) {
      return info;
    }
  }
  
  return null;
}

/**
 * Check if brand has image
 */
export function hasBrandImage(brandSlugOrName: string): boolean {
  const info = getBrandImage(brandSlugOrName);
  return !!(info && info.imageUrl);
}
