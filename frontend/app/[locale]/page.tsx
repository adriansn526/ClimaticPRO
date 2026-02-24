import { getTranslations } from 'next-intl/server';
import { getLatestBannerGallery } from '@/lib/wordpress';
import {
  getWooCommerceCategories,
  getFeaturedProducts,
  getBestSellingProducts,
  getAllBrands,
  getAllProductsCached,
  generateCategoryFilters,
  getProductsByIds
} from '@/lib/woocommerce';
import HeroSection from '@/components/home/HeroSection';
import SidebarMegaMenu from '@/components/home/SidebarMegaMenu';
import TrustBadges from '@/components/home/TrustBadges';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import FeaturedProducts from '@/components/products/FeaturedProducts';
import BestSellers from '@/components/home/BestSellers';
import GlobalTestimonials from '@/components/home/TestimonialsSection'; // Renamed to avoid conflict if any
import ServicesSection from '@/components/home/ServicesSection';
import WhyChooseSection from '@/components/home/WhyChooseSection';
import FinalCTA from '@/components/home/FinalCTA';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'hero' });

  return {
    title: `${t('title')} | ClimaticPro - Gree, Daikin, Midea`,
    description: t('subtitle'),
    keywords: 'aer conditionat, instalare aer conditionat, gree, daikin, midea, bucuresti, climatizare',
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      type: 'website',
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      url: 'https://climaticpro.ro',
      siteName: 'ClimaticPro',
      images: [
        {
          url: 'https://climaticpro.ro/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'ClimaticPro Preview',
        },
      ],
    },
  };
}

export default async function HomePage() {
  const [categories, allProducts, brands] = await Promise.all([
    getWooCommerceCategories(),
    getAllProductsCached(),
    getAllBrands(),
  ]);

  // Generate dynamic filters
  const categoryFilters = generateCategoryFilters(allProducts, categories);

  // Batch 1: Core Content (Highest Priority)
  const [banners, featuredProducts, bestSellers, serviceProducts] = await Promise.all([
    getLatestBannerGallery(),
    getFeaturedProducts(8),
    getBestSellingProducts(4),
    getProductsByIds([9039, 9041])
  ]);

  // Extract prices
  const igienizareProduct = serviceProducts.find(p => p.databaseId === 9039);
  const reparatieProduct = serviceProducts.find(p => p.databaseId === 9041);

  const igienizarePrice = igienizareProduct ? igienizareProduct.price : '';
  const reparatiePrice = reparatieProduct ? reparatieProduct.price : '';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClimaticPro',
    url: 'https://climaticpro.ro',
    logo: 'https://climaticpro.ro/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+40316300101', // Updated from placeholder
      contactType: 'customer service',
      areaServed: 'RO',
      availableLanguage: 'Romanian'
    },
    sameAs: [
      'https://www.facebook.com/climaticpro',
      'https://www.instagram.com/climaticpro'
    ]
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroSection banners={banners}>
        <SidebarMegaMenu
          categories={categories}
          brands={brands}
          categoryFilters={categoryFilters}
        />
      </HeroSection>
      <TrustBadges />
      <FeaturedProducts products={featuredProducts} />
      <CategoriesGrid />
      <BestSellers products={bestSellers} />
      <ServicesSection igienizarePrice={igienizarePrice} reparatiePrice={reparatiePrice} />
      <TestimonialsSection />
      <WhyChooseSection />
      <FinalCTA />
    </main>
  );
}

function TestimonialsSection() {
  return <GlobalTestimonials />;
}
