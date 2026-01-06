import { NextResponse } from 'next/server';
import { getInstallationProducts } from '@/lib/woocommerce';

export async function GET() {
  try {
    const products = await getInstallationProducts(3);
    
    // Transform WooCommerce products to wizard format
    const transformedProducts = products.map((product) => {
      // Extract BTU from attributes or name
      const btuMatch = product.name.match(/(\d+)\s*BTU/i);
      const btu = btuMatch ? parseInt(btuMatch[1]) : 12000;
      
      // Extract energy class from attributes
      const energyClassAttr = product.attributes?.nodes.find(
        attr => attr.name.toLowerCase().includes('clasa') || attr.name.toLowerCase().includes('energy')
      );
      const energyClass = energyClassAttr?.options[0] || 'A++';
      
      // Extract features from short description or attributes
      const features: string[] = [];
      if (product.shortDescription) {
        const featureMatches = product.shortDescription.match(/<li>(.*?)<\/li>/g);
        if (featureMatches) {
          featureMatches.forEach(match => {
            const feature = match.replace(/<\/?li>/g, '').trim();
            if (feature) features.push(feature);
          });
        }
      }
      
      // Default features if none found
      if (features.length === 0) {
        features.push('Inverter', 'WiFi Ready', 'Eco Mode');
      }
      
      const price = parseFloat(product.regularPrice || product.price || '0');
      const installationPrice = 1000;
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
