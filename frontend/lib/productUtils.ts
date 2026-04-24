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
  const energyAttr = product.attributes?.nodes?.find(
    attr => attr.name.toLowerCase().includes('energie') ||
      attr.name.toLowerCase().includes('energy') ||
      attr.name.toLowerCase().includes('clasa')
  );
  if (energyAttr) {
    if (energyAttr.terms?.nodes && energyAttr.terms.nodes.length > 0) {
      energyClass = energyAttr.terms.nodes[0].name.toUpperCase();
    } else if (energyAttr.options && energyAttr.options.length > 0) {
      let rawClass = energyAttr.options[0];
      energyClass = formatAttributeValue(rawClass);
    }
  }

  // If not in attributes, try to extract from name or description
  if (!energyClass) {
    const energyMatch = (name + ' ' + shortDesc).match(/\b(A\+{1,3}|A\+{1,3}\s*\/\s*A\+{1,3}|A|B|C|D)\b/);
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
export function extractBrand(product: WooCommerceProduct): string | null {
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

  return null;
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

/**
 * Format attribute name (slug to readable label)
 */
export function formatAttributeLabel(name: string): string {
  const niceNames: Record<string, string> = {
    'pa_brand': 'Brand',
    'pa_producator': 'Producător',
    'pa_capacitate-btu': 'Capacitate (BTU)',
    'pa_capacitate': 'Capacitate',
    'pa_capacitate-aparat': 'Capacitate Aparat',
    'pa_capacitate-racire': 'Capacitate Răcire',
    'pa_capacitate-incalzire': 'Capacitate Încălzire',
    'pa_clasa-energetica': 'Clasă Energetică',
    'pa_clasa-energie': 'Clasă Energie',
    'pa_clasa-energetica-racire': 'Clasă Energetică (Răcire)',
    'pa_clasa-energetica-incalzire': 'Clasă Energetică (Încălzire)',
    'pa_nivel-zgomot': 'Nivel Zgomot',
    'pa_zgomot-unitate-interioara': 'Zgomot U. Interioară',
    'pa_zgomot-unitate-exterioara': 'Zgomot U. Exterioară',
    'pa_suprafata-acoperita': 'Suprafață Acoperită',
    'pa_tip-compresor': 'Tip Compresor',
    'pa_tehnologie-wifi': 'WiFi',
    'pa_wifi': 'WiFi',
    'pa_garantie': 'Garanție',
    'pa_refrigerant': 'Refrigerant',
    'pa_agent-frigorific': 'Agent Frigorific',
    'pa_dimensiuni': 'Dimensiuni',
    'pa_dimensiuni-unitate-interioara': 'Dimensiuni U. Interioară',
    'pa_dimensiuni-unitate-exterioara': 'Dimensiuni U. Exterioară',
    'pa_dimensiune-ue-lxlxh-mm': 'Dimensiune UE (LxIxA)',
    'pa_dimensiune-ui-lxlxh-mm': 'Dimensiune UI (LxIxA)',
    'pa_greutate': 'Greutate',
    'pa_greutate-unitate-interioara': 'Greutate U. Interioară',
    'pa_greutate-unitate-exterioara': 'Greutate U. Exterioară',
    'pa_kit-instalare': 'Kit Instalare',
    'pa_culoare': 'Culoare',
    'pa_functii': 'Funcții Speciale',
    'pa_alimentare': 'Alimentare',
    'pa_consum-nominal-w': 'Consum Nominal (W)',
    'pa_filtru': 'Filtru',
    'pa_tip-freon': 'Tip Freon',
    'pa_caracteristici-speciale': 'Caracteristici Speciale',
  };

  if (niceNames[name]) return niceNames[name];

  // Fallback: Remove pa_ and format
  return name
    .replace(/^pa_/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format attribute value (fix slugs like a-a-2)
 */
export function formatAttributeValue(value: string): string {
  if (!value) return '-';

  const v = value.toLowerCase().trim();

  // Energy classes
  if (v === 'a-a-3') return 'A+++ / A++';
  if (v === 'a-a-2') return 'A++ / A+';
  if (v === 'a-a') return 'A+++ / A+++';
  if (v === 'a-plus-plus-plus') return 'A+++';
  if (v === 'a-plus-plus' || v === 'a') return 'A++';
  if (v === 'a-a-1' || v === 'a-plus') return 'A+';
  if (v === 'b' || v === 'c' || v === 'd' || v === 'e' || v === 'f' || v === 'g') return value.toUpperCase();

  // Boolean-ish
  if (v === 'da' || v === 'yes') return 'Da';
  if (v === 'nu' || v === 'no') return 'Nu';

  // Specific value tweaks
  if (v.includes('aer-conditionat-')) {
    return value.replace(/aer-conditionat-/gi, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // General slug handling: replace hyphens with spaces if looks like a slug
  if (v.includes('-') && !v.match(/\d/)) { // Simple alpha slugs
    return value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Handle "12000-btu" -> "12000 BTU"
  if (v.match(/^\d+-btu$/)) {
    return value.replace('-', ' ').toUpperCase();
  }

  return value;
}
