import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductBySlug, getProducts, getProductById } from '@/lib/woocommerce';
import { extractProductSpecs, extractBrand, cleanPrice } from '@/lib/productUtils';
import { getPrisma } from '@/lib/prisma';
import ProductGallery from '@/components/products/ProductGallery';
import ProductInfo from '@/components/products/ProductInfo';
import ProductSections from '@/components/products/ProductSections';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ProductCard from '@/components/products/ProductCard';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';


export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Produs negăsit | ClimaticPro',
    };
  }

  const specs = extractProductSpecs(product);
  const brand = extractBrand(product);
  const price = cleanPrice(product.price);

  return {
    title: `${product.name} | ClimaticPro`,
    description: `${brand ? brand + ' ' : ''}${specs.btu ? specs.btu + ' BTU' : ''} ${specs.energyClass ? 'Clasa ' + specs.energyClass : ''}. Preț: ${price}. Livrare gratuită + Instalare profesională. Garanție 5 ani.`,
    keywords: `aer conditionat ${brand ? brand.toLowerCase() + ', ' : ''}${specs.btu} btu, ${specs.energyClass?.toLowerCase()}, ${specs.inverter ? 'inverter' : ''}, ${specs.wifi ? 'wifi' : ''}`,
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.name,
      images: product.image ? [product.image.sourceUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const specs = extractProductSpecs(product);
  const brand = extractBrand(product);

  // Calculate dynamic installation prices
  let standardPrice = 950;
  let premiumPrice = 1150;

  try {
    const prisma = getPrisma();
    let min12k = 950;
    let min18k = 1100;
    let min24k = 1200;

    const setting = await prisma.appSetting.findUnique({ where: { key: 'global_pricing_override' } });
    let overrideActive = false;

    if (setting?.value) {
      try {
        const globalOverride = JSON.parse(setting.value);
        if (globalOverride.isActive) {
           overrideActive = true;
           min12k = globalOverride.basePrice12k || 950;
           min18k = globalOverride.basePrice18k || 1100;
           min24k = globalOverride.basePrice24k || 1200;
        }
      } catch (e) { }
    }

    if (!overrideActive) {
       const installers = await prisma.installerProfile.findMany({
           where: { status: 'approved', basePrice12k: { not: null } },
           select: { basePrice12k: true, basePrice18k: true, basePrice24k: true }
       });

       if (installers.length > 0) {
           let m12k = Infinity, m18k = Infinity, m24k = Infinity;
           for (const inst of installers) {
               if (inst.basePrice12k && inst.basePrice12k < m12k) m12k = inst.basePrice12k;
               if (inst.basePrice18k && inst.basePrice18k < m18k) m18k = inst.basePrice18k;
               if (inst.basePrice24k && inst.basePrice24k < m24k) m24k = inst.basePrice24k;
           }
           min12k = m12k === Infinity ? 700 : m12k;
           min18k = m18k === Infinity ? 850 : m18k;
           min24k = m24k === Infinity ? 950 : m24k;
       } else {
           min12k = 700;
           min18k = 850;
           min24k = 950;
       }
    }
    let btuValue = 12000;
    if (specs.btu) {
       const raw = specs.btu.replace(/[^0-9]/g, '');
       if (raw) btuValue = parseInt(raw);
    }
    
    if (btuValue < 18000) {
       standardPrice = min12k;
    } else if (btuValue >= 18000 && btuValue < 24000) {
       standardPrice = min18k;
    } else {
       standardPrice = min24k;
    }
    
    premiumPrice = standardPrice + 200; // Premium margin fallback
  } catch(e) {
    console.error("Pricing dynamic error", e);
  }

  // Fetch installation products
  const standardInstallation = await getProductById(11170);
  const premiumInstallation = await getProductById(9043);

  if (standardInstallation) {
      standardInstallation.price = String(standardPrice);
      standardInstallation.salePrice = String(standardPrice);
      standardInstallation.regularPrice = String(standardPrice);
  }
  if (premiumInstallation) {
      premiumInstallation.price = String(premiumPrice);
      premiumInstallation.salePrice = String(premiumPrice);
      premiumInstallation.regularPrice = String(premiumPrice);
  }

  // Fetch related products (same category)
  const categorySlug = product.productCategories?.nodes[0]?.slug;
  let relatedProducts: any[] = [];
  if (categorySlug) {
    const { products } = await getProducts({
      category: categorySlug,
      exclude: [product.databaseId]
    }, 4);
    relatedProducts = products;
  }

  // Fetch B2B Suppliers for Admin Module
  let b2bSuppliers: any[] = [];
  let isMandatoryInstall = false;
  try {
     const prisma = getPrisma();
     const b2bProd = await prisma.b2BProduct.findFirst({
         where: { slug: params.slug },
         include: { suppliers: { include: { supplier: true } } }
     });
     if (b2bProd && b2bProd.suppliers) {
         b2bSuppliers = b2bProd.suppliers.map((s: any) => ({
             name: s.supplier.name,
             price: s.supplierPrice,
             currency: 'RON',
             last_updated: s.lastScrapedAt?.toISOString() || new Date().toISOString()
         }));
     }
     if (b2bProd && b2bProd.forceInstallation) {
         isMandatoryInstall = true;
     }

  } catch (err) {}

  // Prepare breadcrumbs
  const breadcrumbs = [
    { label: 'Acasă', href: '/' },
    { label: 'Produse', href: '/produse' },
    ...(brand ? [{ label: brand, href: `/produse?brand=${brand.toLowerCase()}` }] : []),
    { label: product.name },
  ];

  // Prepare gallery images
  const galleryImages = [
    ...(product.image ? [product.image] : []),
    ...(product.galleryImages?.nodes || []),
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      {/* Product Main Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-lg shadow-sm p-6">
          {/* Left: Gallery */}
          <ProductGallery images={galleryImages} productName={product.name} />

          {/* Right: Product Info */}
          <ProductInfo
            product={product}
            specs={specs}
            brand={brand}
            standardInstallation={standardInstallation}
            premiumInstallation={premiumInstallation}
            b2bSuppliers={b2bSuppliers}
            isMandatoryInstall={isMandatoryInstall} 
          />
        </div>

      </div>

      {/* Product Sections - Vertical Layout with Sticky Nav */}
      <ProductSections product={product} specs={specs} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Produse Similare</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.name,
            image: galleryImages.map(img => img.sourceUrl),
            description: product.shortDescription || product.name,
            sku: product.sku || product.databaseId.toString(),
            brand: {
              '@type': 'Brand',
              name: brand || 'Generic',
            },
            offers: {
              '@type': 'Offer',
              url: `https://climaticpro.ro/produs/${product.slug}`,
              priceCurrency: 'RON',
              price: parseFloat(product.price.replace(/[^\d.]/g, '')),
              availability: product.stockStatus === 'IN_STOCK'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              seller: {
                '@type': 'Organization',
                name: 'ClimaticPro',
                url: 'https://climaticpro.ro',
              },
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingRate: {
                  '@type': 'MonetaryAmount',
                  value: '0',
                  currency: 'RON',
                },
                deliveryTime: {
                  '@type': 'ShippingDeliveryTime',
                  handlingTime: {
                    '@type': 'QuantitativeValue',
                    minValue: 0,
                    maxValue: 1,
                    unitCode: 'DAY',
                  },
                },
              },
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '127',
            },
            additionalProperty: specs.btu ? [
              {
                '@type': 'PropertyValue',
                name: 'Capacitate răcire',
                value: `${specs.btu} BTU`,
              },
              ...(specs.energyClass ? [{
                '@type': 'PropertyValue',
                name: 'Clasă energetică',
                value: specs.energyClass,
              }] : []),
              ...(specs.area ? [{
                '@type': 'PropertyValue',
                name: 'Suprafață recomandată',
                value: specs.area,
              }] : []),
            ] : [],
            ...(specs.energyClass ? {
              hasEnergyConsumptionDetails: {
                '@type': 'EnergyConsumptionDetails',
                hasEnergyEfficiencyCategory: {
                  '@type': 'EnergyEfficiencyCategory',
                  name: specs.energyClass
                },
                energyEfficiencyScaleMin: 'D',
                energyEfficiencyScaleMax: 'A+++'
              }
            } : {})
          }),
        }}
      />
    </main>
  );
}
