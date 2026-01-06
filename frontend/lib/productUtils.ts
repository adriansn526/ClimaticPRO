import { WooCommerceProduct } from './woocommerce';

export interface ProductSpecs {
  btu: string | null;
  energyClass: string | null;
  area: string | null;
  inverter: boolean;
  wifi: boolean;
}

/**
 * Extract product specifications from name, description, and attributes
 */
export function extractProductSpecs(product: WooCommerceProduct): ProductSpecs {
  const name = product.name.toUpperCase();
  const shortDesc = product.shortDescription?.toUpperCase() || '';
  
  // Extract BTU
  const btuMatch = name.match(/(\d+)\s*BTU/i);
  const btu = btuMatch ? btuMatch[1] : null;
  
  // Extract Energy Class
  // Common patterns: A+++, A++, A+, A, B, C, D
  let energyClass: string | null = null;
  
  // Check attributes first
  if (product.attributes?.nodes) {
    const energyAttr = product.attributes.nodes.find(
      attr => attr.name.toLowerCase().includes('energie') || 
              attr.name.toLowerCase().includes('energy') ||
              attr.name.toLowerCase().includes('clasa')
    );
    if (energyAttr && energyAttr.options.length > 0) {
      energyClass = energyAttr.options[0];
    }
  }
  
  // If not in attributes, try to extract from name or description
  if (!energyClass) {
    const energyMatch = (name + ' ' + shortDesc).match(/\b(A\+{1,3}|A|B|C|D)\b/);
    if (energyMatch) {
      energyClass = energyMatch[1];
    }
  }
  
  // Default based on BTU and brand for realistic values
  if (!energyClass && btu) {
    const btuNum = parseInt(btu);
    // Modern inverter ACs typically have A++ or A+++ ratings
    if (name.includes('INVERTER')) {
      energyClass = btuNum <= 12000 ? 'A+++' : 'A++';
    } else {
      energyClass = 'A+';
    }
  }
  
  // Calculate recommended area based on BTU
  // Rule of thumb: ~350-400 BTU per m²
  let area: string | null = null;
  if (btu) {
    const btuNum = parseInt(btu);
    const minArea = Math.floor(btuNum / 400);
    const maxArea = Math.ceil(btuNum / 350);
    area = `${minArea}-${maxArea}m²`;
  }
  
  // Check for Inverter technology
  const inverter = name.includes('INVERTER');
  
  // Check for WiFi
  const wifi = name.includes('WIFI') || name.includes('WI-FI') || shortDesc.includes('WIFI');
  
  return {
    btu,
    energyClass,
    area,
    inverter,
    wifi,
  };
}

/**
 * Extract brand from product
 */
export function extractBrand(product: WooCommerceProduct): string {
  // Try allPaBrand taxonomy first (real WooCommerce product attribute)
  if (product.allPaBrand?.nodes && product.allPaBrand.nodes.length > 0) {
    return product.allPaBrand.nodes[0].name;
  }
  
  // Try categories as fallback
  if (product.productCategories?.nodes && product.productCategories.nodes.length > 0) {
    const categoryName = product.productCategories.nodes[0].name.toUpperCase();
    if (['GREE', 'DAIKIN', 'MIDEA'].includes(categoryName)) {
      return categoryName;
    }
  }
  
  // Try to extract from name
  const brandMatch = product.name.match(/(GREE|DAIKIN|MIDEA)/i);
  if (brandMatch) {
    return brandMatch[1].toUpperCase();
  }
  
  return 'ClimaticPRO';
}

/**
 * Clean price string (remove HTML entities)
 */
export function cleanPrice(price: string): string {
  return price.replace(/&nbsp;/g, ' ').replace(/lei/g, 'RON').trim();
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(regularPrice: string, salePrice: string | null): number | null {
  if (!salePrice) return null;
  
  const regular = parseFloat(regularPrice.replace(/[^\d.]/g, ''));
  const sale = parseFloat(salePrice.replace(/[^\d.]/g, ''));
  
  if (isNaN(regular) || isNaN(sale) || regular <= sale) return null;
  
  const discount = Math.round(((regular - sale) / regular) * 100);
  return discount > 0 ? discount : null;
}
