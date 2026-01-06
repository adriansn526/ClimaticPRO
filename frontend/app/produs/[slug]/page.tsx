import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductBySlug } from '@/lib/woocommerce';
import { extractProductSpecs, extractBrand, cleanPrice } from '@/lib/productUtils';
import ProductGallery from '@/components/products/ProductGallery';
import ProductInfo from '@/components/products/ProductInfo';
import ProductSections from '@/components/products/ProductSections';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

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
    description: `${brand} ${specs.btu ? specs.btu + ' BTU' : ''} ${specs.energyClass ? 'Clasa ' + specs.energyClass : ''}. Preț: ${price}. Livrare gratuită + Instalare profesională. Garanție 5 ani.`,
    keywords: `aer conditionat ${brand.toLowerCase()}, ${specs.btu} btu, ${specs.energyClass?.toLowerCase()}, ${specs.inverter ? 'inverter' : ''}, ${specs.wifi ? 'wifi' : ''}`,
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

  // Prepare breadcrumbs
  const breadcrumbs = [
    { label: 'Acasă', href: '/' },
    { label: 'Produse', href: '/produse' },
    { label: brand, href: `/produse?brand=${brand.toLowerCase()}` },
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
          <ProductInfo product={product} specs={specs} brand={brand} />
        </div>

      </div>

      {/* Product Sections - Vertical Layout with Sticky Nav */}
      <ProductSections product={product} specs={specs} />

      {/* Related Products */}
      {/* TODO: Add related products section */}

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
              name: brand,
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
          }),
        }}
      />
    </main>
  );
}
