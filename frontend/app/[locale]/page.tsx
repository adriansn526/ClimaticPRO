import { getTranslations } from 'next-intl/server';
import { getBannereByLocatie } from '@/lib/bannere';
import { getWooCommerceCategories, getFeaturedProducts, getBestSellingProducts } from '@/lib/woocommerce';
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
  const [banners, categories, featuredProducts, bestSellers] = await Promise.all([
    getBannereByLocatie('homepage_hero', 5),
    getWooCommerceCategories(),
    getFeaturedProducts(8),
    getBestSellingProducts(4),
  ]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClimaticPro',
    url: 'https://climaticpro.ro',
    logo: 'https://climaticpro.ro/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+40700000000', // Update with real number if available
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
        <SidebarMegaMenu categories={categories} />
      </HeroSection>
      <TrustBadges />
      <FeaturedProducts products={featuredProducts} />
      <CategoriesGrid />
      <BestSellers products={bestSellers} />
      <ServicesSection />
      <TestimonialsSection />
      <WhyChooseSection />
      <FinalCTA />
    </main>
  );
}

function TestimonialsSection() {
  return <GlobalTestimonials />;
}
