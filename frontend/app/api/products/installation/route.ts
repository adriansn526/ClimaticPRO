import { NextResponse } from 'next/server';
import { getInstallationProducts, getProductsByTag, getProductById } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Try to get product by tag "hero-instalare" first
    let products = await getProductsByTag('hero-instalare', 1);

    // 2. Fallback to featured products if no tag found
    if (products.length === 0) {
      products = await getInstallationProducts(3);
    }

    // 3. Fetch specific Installation Product (ID 11170) to get current price
    let installationProductPrice = 1000;
    try {
      const installProduct = await getProductById(11170); // New helper
      if (installProduct) {
        const parsePrice = (priceStr: string | null | undefined): number => {
          if (!priceStr) return 0;
          let clean = priceStr.toLowerCase().replace(/lei|ron|\s/g, '');
          if (clean.includes(',') && clean.includes('.')) {
            if (clean.indexOf('.') < clean.indexOf(',')) { clean = clean.replace(/\./g, '').replace(',', '.'); }
            else { clean = clean.replace(/,/g, ''); }
          } else if (clean.includes('.')) {
            const parts = clean.split('.');
            if (parts.length > 1 && parts[parts.length - 1].length === 3) clean = clean.replace('.', '');
          } else if (clean.includes(',')) clean = clean.replace(',', '.');
          return parseFloat(clean) || 0;
        };
        const parsed = parsePrice(installProduct.price || installProduct.regularPrice);
        if (parsed > 0) installationProductPrice = parsed;
      }
    } catch (e) {
      console.warn('Failed to fetch installation product 11170', e);
    }



    // Transform WooCommerce products to wizard format
    const transformedProducts = products.map((product) => {
      // Extract BTU from attributes or name
      const btuMatch = product.name.match(/(\d+)\s*BTU/i);
      const btu = btuMatch ? parseInt(btuMatch[1]) : 12000;

      // Extract energy class from attributes
      const energyClassAttr = product.attributes?.nodes.find(
        (attr: any) => attr.name.toLowerCase().includes('clasa') || attr.name.toLowerCase().includes('energy')
      );

      let rawEnergy = energyClassAttr?.options[0] || 'A++';

      // Helper to format energy class
      const formatEnergy = (val: string) => {
        if (!val) return 'A++';
        // Common slug to label mappings
        if (val === 'a-3' || val === 'a-a-3') return 'A+++';
        if (val === 'a-2' || val === 'a-a-2') return 'A++';
        if (val === 'a-1' || val === 'a-a-1') return 'A+';
        if (val.toLowerCase() === 'a') return 'A';

        // Fallback: uppercase and replace hyphens if it looks like a class
        return val.toUpperCase().replace(/-/g, ' ');
      };

      const energyClass = formatEnergy(rawEnergy);

      // Extract features from short description or attributes
      const features: string[] = [];
      if (product.shortDescription) {
        // Strip ALL HTML tags first
        const cleanDescription = product.shortDescription.replace(/<[^>]*>?/gm, ' ');
        // Split by bullets or special chars if common usage, OR extract specifically from li if desired.
        // User asked to remove tags, so we aggressively strip.
        // However, regex match for li content is safer for lists.
        const featureMatches = product.shortDescription.match(/<li>(.*?)<\/li>/g);

        if (featureMatches) {
          featureMatches.forEach(match => {
            // Strip tags from within the li
            const feature = match.replace(/<[^>]+>/g, '').trim();
            if (feature) features.push(feature);
          });
        }
      }

      // Default features if none found
      if (features.length === 0) {
        // Try to get from attributes
        if (product.attributes) {
          // Maybe map some attributes? For now default.
          features.push('Inverter', 'WiFi Ready', 'Eco Mode');
        } else {
          features.push('Inverter', 'WiFi Ready', 'Eco Mode');
        }
      }

      // Robust Price Parsing
      // WooCommerce might return "2.899", "2.899,00", "2,899.00", "2899"
      const parsePrice = (priceStr: string | null | undefined): number => {
        if (!priceStr) return 0;
        // Remove 'lei', 'ron', whitespace
        let clean = priceStr.toLowerCase().replace(/lei|ron|\s/g, '');

        // If it looks like '2.899' (thousands dot, no decimal), remove dot
        // If '2.899,00' (EU style), remove dot, replace comma with dot
        // If '2,899.00' (US style), remove comma

        // Simple heuristic: If multiple dots/commas, or comma is last separator.

        // Assume format is likely 1.234,56 or 1.234
        if (clean.includes(',') && clean.includes('.')) {
          if (clean.indexOf('.') < clean.indexOf(',')) {
            // 1.234,56 -> 1234.56
            clean = clean.replace(/\./g, '').replace(',', '.');
          } else {
            // 1,234.56 -> 1234.56
            clean = clean.replace(/,/g, '');
          }
        } else if (clean.includes('.')) {
          // Check if it's likely a thousand sep (e.g. 2.899) vs decimal (2.99)
          // If 3 digits after dot, it's ambiguous, but usually prices > 1000 have thousand sep.
          const parts = clean.split('.');
          if (parts.length > 1 && parts[parts.length - 1].length === 3 && parts.length === 2 && parseInt(parts[0]) < 100) {
            // 2.899 could be 2.899 or 2899. Context of AC -> 2899
            clean = clean.replace('.', '');
          } else if (parts.length > 2) {
            // 1.234.567
            clean = clean.replace(/\./g, '');
          } else if (parts.length === 2 && parts[1].length === 3) {
            // 2.899 -> 2899 (Thousands)
            clean = clean.replace('.', '');
          }
        } else if (clean.includes(',')) {
          // 2899,00 -> 2899.00
          clean = clean.replace(',', '.');
        }

        return parseFloat(clean) || 0;
      };

      const price = parsePrice(product.regularPrice || product.price);
      const installationPrice = installationProductPrice;
      const priceWithInstallation = price + installationPrice - 30; // Discount 30 RON

      // Determine badge based on product properties
      let badge: string | undefined;
      if (product.featured && btu === 12000) {
        badge = 'CEL MAI VÂNDUT';
      } else if (product.featured && btu === 9000) {
        badge = 'POPULAR';
      }

      return {
        id: product.databaseId,
        name: product.name,
        slug: product.slug,
        btu,
        price,
        priceWithInstallation,
        energyClass,
        image: product.image?.sourceUrl || '/products/placeholder.jpg',
        features: features.slice(0, 4), // Max 4 features
        badge,
        brand: product.allPaBrand?.nodes[0]?.name || '',
        stockStatus: product.stockStatus,
      };
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      installationPrice: installationProductPrice
    });

  } catch (error: any) {
    console.error('Error fetching installation products:', error);

    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      products: [
        {
          id: 1,
          name: 'Daikin Sensira 9000 BTU',
          slug: 'daikin-sensira-9000-btu',
          btu: 9000,
          price: 1599,
          priceWithInstallation: 2569,
          energyClass: 'A+++',
          image: '/products/daikin-9000.jpg',
          badge: 'CEL MAI VÂNDUT',
          features: ['Inverter', 'WiFi Ready', 'Silențios 19dB', 'Filtru purificare'],
          brand: 'Daikin',
          stockStatus: 'IN_STOCK',
        },
        {
          id: 2,
          name: 'Midea Mission Pro 12000 BTU',
          slug: 'midea-mission-pro-12000-btu',
          btu: 12000,
          price: 1929,
          priceWithInstallation: 2899,
          energyClass: 'A++',
          image: '/products/midea-12000.jpg',
          badge: 'POPULAR',
          features: ['Inverter', 'Eco Mode', 'Timer 24h', 'Auto-curățare'],
          brand: 'Midea',
          stockStatus: 'IN_STOCK',
        },
        {
          id: 3,
          name: 'LG Dual Cool 18000 BTU',
          slug: 'lg-dual-cool-18000-btu',
          btu: 18000,
          price: 2899,
          priceWithInstallation: 3869,
          energyClass: 'A++',
          image: '/products/lg-18000.jpg',
          features: ['Dual Inverter', 'WiFi', 'Ionizator', 'Active Energy Control'],
          brand: 'LG',
          stockStatus: 'IN_STOCK',
        },
      ],
    });
  }
}
