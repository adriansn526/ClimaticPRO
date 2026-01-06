/**
 * Brand logos mapping for ClimaticPRO
 * Maps brand names to their logo URLs
 */

export interface BrandInfo {
  name: string;
  logo?: string;
  color?: string;
}

export const BRAND_LOGOS: Record<string, BrandInfo> = {
  'midea': {
    name: 'Midea',
    logo: '/images/brands/midea-logo.svg',
    color: '#E31E24',
  },
  'gree': {
    name: 'Gree',
    logo: '/images/brands/gree-logo.svg',
    color: '#0066CC',
  },
  'daikin': {
    name: 'Daikin',
    logo: '/images/brands/daikin-logo.svg',
    color: '#0066B3',
  },
  'lg': {
    name: 'LG',
    logo: '/images/brands/lg-logo.svg',
    color: '#A50034',
  },
  'samsung': {
    name: 'Samsung',
    logo: '/images/brands/samsung-logo.svg',
    color: '#1428A0',
  },
  'mitsubishi': {
    name: 'Mitsubishi',
    logo: '/images/brands/mitsubishi-logo.svg',
    color: '#E60012',
  },
  'panasonic': {
    name: 'Panasonic',
    logo: '/images/brands/panasonic-logo.svg',
    color: '#0062AF',
  },
  'toshiba': {
    name: 'Toshiba',
    logo: '/images/brands/toshiba-logo.svg',
    color: '#FF0000',
  },
  'fujitsu': {
    name: 'Fujitsu',
    logo: '/images/brands/fujitsu-logo.svg',
    color: '#E60012',
  },
  'haier': {
    name: 'Haier',
    logo: '/images/brands/haier-logo.svg',
    color: '#005BAC',
  },
  'hisense': {
    name: 'Hisense',
    logo: '/images/brands/hisense-logo.svg',
    color: '#E31E24',
  },
  'electrolux': {
    name: 'Electrolux',
    logo: '/images/brands/electrolux-logo.svg',
    color: '#2C5697',
  },
  'whirlpool': {
    name: 'Whirlpool',
    logo: '/images/brands/whirlpool-logo.svg',
    color: '#ED1C24',
  },
  'carrier': {
    name: 'Carrier',
    logo: '/images/brands/carrier-logo.svg',
    color: '#0066B3',
  },
  'york': {
    name: 'York',
    logo: '/images/brands/york-logo.svg',
    color: '#003DA5',
  },
};

/**
 * Get brand info by name
 * Normalizes brand name and returns logo info
 */
export function getBrandInfo(brandName: string): BrandInfo {
  const normalizedName = brandName.toLowerCase().trim();
  
  // Direct match
  if (BRAND_LOGOS[normalizedName]) {
    return BRAND_LOGOS[normalizedName];
  }
  
  // Partial match (e.g., "Aer conditionat Midea" -> "midea")
  for (const [key, info] of Object.entries(BRAND_LOGOS)) {
    if (normalizedName.includes(key)) {
      return info;
    }
  }
  
  // No match - return brand name without logo
  return {
    name: brandName,
  };
}

/**
 * Check if brand has logo
 */
export function hasBrandLogo(brandName: string): boolean {
  const info = getBrandInfo(brandName);
  return !!info.logo;
}
