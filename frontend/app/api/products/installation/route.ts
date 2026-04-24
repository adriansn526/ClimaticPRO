import { NextResponse } from 'next/server';
import { getInstallationProducts, getProductsByTag, getProductById } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Try to get product by tag "hero-instalare"
    let products = await getProductsByTag('hero-instalare', 6); // Fetch more than 1 if needed


    // 3. Fetch specific Installation Product (ID 11170) to get current price
    let installationProductPrice = 1000;
    let installationRegularPrice: number | null = null;
    const parsePrice = (priceStr: string | null | undefined): number => {
      if (!priceStr) return 0;
      let clean = priceStr.toLowerCase().replace(/lei|ron|\s/g, '');
      if (clean.includes(',') && clean.includes('.')) {
        if (clean.indexOf('.') < clean.indexOf(',')) { clean = clean.replace(/\./g, '').replace(',', '.'); }
        else { clean = clean.replace(/,/g, ''); }
      } else if (clean.includes('.')) {
        const parts = clean.split('.');
        if (parts.length > 1 && parts[parts.length - 1].length === 3 && parts.length === 2 && parseInt(parts[0]) < 100) clean = clean.replace('.', '');
        else if (parts.length > 2) clean = clean.replace(/\./g, '');
        else if (parts.length === 2 && parts[1].length === 3) clean = clean.replace('.', '');
      } else if (clean.includes(',')) clean = clean.replace(',', '.');
      return parseFloat(clean) || 0;
    };

    try {
      const installProduct = await getProductById(11170); // New helper
      if (installProduct) {
        let pPrice = parsePrice(installProduct.price);
        let rPrice = parsePrice(installProduct.regularPrice);
        if (pPrice > 0) {
          installationProductPrice = pPrice;
          if (rPrice > 0 && rPrice > pPrice) {
            installationRegularPrice = rPrice;
          }
        } else if (rPrice > 0) {
          installationProductPrice = rPrice;
        }
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

      // Smart extraction from attributes
      if (product.attributes && product.attributes.nodes) {
        const attrs = product.attributes.nodes;

        // 1. Tehnologie (Inverter)
        const tehno = attrs.find((a: any) => a.name.toLowerCase().includes('inverter') || a.name.toLowerCase() === 'tehnologie');
        if (tehno && tehno.options && tehno.options.length > 0) {
          // Daca numele e chiar "Inverter", il punem direct. Altfel punem "Inverter" daca optiunea zice Da.
          if (tehno.name.toLowerCase().includes('inverter')) features.push('Inverter');
          else features.push(tehno.options[0]);
        } else {
          features.push('Inverter'); // Default bun
        }

        // 2. Control / WiFi
        const wifi = attrs.find((a: any) => a.name.toLowerCase().includes('wi-fi') || a.name.toLowerCase().includes('wifi'));
        if (wifi && wifi.options && wifi.options.length > 0) {
          if (wifi.options[0].toLowerCase() === 'da' || wifi.options[0].toLowerCase().includes('inclus')) {
            features.push('Modul Wi-Fi Integrat');
          } else {
            features.push(`Wi-Fi: ${wifi.options[0]}`);
          }
        } else {
          features.push('Wi-Fi Ready');
        }

        // 3. Zgomot
        const noise = attrs.find((a: any) => a.name.toLowerCase().includes('zgomot'));
        if (noise && noise.options && noise.options.length > 0) {
          features.push(`Silențios (${noise.options[0]})`);
        }

        // 4. Agent Frigorific
        const freon = attrs.find((a: any) => a.name.toLowerCase().includes('agent frigorific') || a.name.toLowerCase().includes('freon'));
        if (freon && freon.options && freon.options.length > 0) {
          features.push(`Agent frigorific ${freon.options[0]}`);
        }
      }

      // If we still don't have enough features, try shortDescription
      if (features.length < 3 && product.shortDescription) {
        const featureMatches = product.shortDescription.match(/<li>(.*?)<\/li>/g);
        if (featureMatches) {
          featureMatches.forEach(match => {
            const feature = match.replace(/<[^>]+>/g, '').trim();
            if (feature && features.length < 6 && !features.some(f => f.toLowerCase() === feature.toLowerCase())) {
              features.push(feature);
            }
          });
        }
      }

      // Default features if none found
      if (features.length === 0) {
        features.push('Inverter', 'WiFi Ready', 'Eco Mode', 'Silențios');
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

    // Fetch Premium Package specifically
    let premiumPackagePrice = 1250;
    let premiumRegularPrice: number | null = null;
    try {
      const premProduct = await getProductById(9043);
      if (premProduct) {
        let pPrice = parsePrice(premProduct.price);
        let rPrice = parsePrice(premProduct.regularPrice);
        if (pPrice > 0) {
          premiumPackagePrice = pPrice;
          if (rPrice > 0 && rPrice > pPrice) {
            premiumRegularPrice = rPrice;
          }
        } else if (rPrice > 0) {
          premiumPackagePrice = rPrice;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch premium package product 9043', e);
    }

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      installationPrice: installationProductPrice,
      servicePackages: {
        standard: { price: installationProductPrice, regularPrice: installationRegularPrice },
        premium: { price: premiumPackagePrice, regularPrice: premiumRegularPrice }
      }
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
