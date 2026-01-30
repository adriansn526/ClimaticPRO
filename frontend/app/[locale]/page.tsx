import { getTranslations } from 'next-intl/server';
import { getBannereByLocatie } from '@/lib/bannere';
import {
  getWooCommerceCategories,
  getFeaturedProducts,
  getBestSellingProducts,
  getAllBrands,
  getAllCapacitate,
  getAllClasaEnergie,
  getUsedAttributeSlugs
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
  const categories = await getWooCommerceCategories();

  // Extract slugs recursively for broader product search
  const rezCat = categories.find(c => c.slug === 'aer-conditionat-rezidential');
  const rezSlugsList = rezCat ? [rezCat.slug, ...(rezCat.children?.nodes?.map((c: any) => c.slug) || [])] : ['aer-conditionat-rezidential'];

  const comCat = categories.find(c => c.slug.includes('comercial')); // Robust finder
  const comSlugsList = comCat ? [comCat.slug, ...(comCat.children?.nodes?.map((c: any) => c.slug) || [])] : ['aparat-de-aer-conditionat-comercial'];

  // Batch 1: Core Content (Highest Priority)
  const [banners, featuredProducts, bestSellers] = await Promise.all([
    getBannereByLocatie('homepage_hero', 5),
    getFeaturedProducts(8),
    getBestSellingProducts(4),
  ]);

  // Batch 2: Global Filters & Brands (Medium Priority)
  const [brands, allCapacities, allEnergyClasses] = await Promise.all([
    getAllBrands(),
    getAllCapacitate(),
    getAllClasaEnergie(),
  ]);

  // Batch 3: Dynamic Filters (Dependent Priority)
  const [rezidentialSlugs, comercialSlugs] = await Promise.all([
    getUsedAttributeSlugs(rezSlugsList),
    getUsedAttributeSlugs(comSlugsList)
  ]);




  // Filter global lists based on category usage
  const rezidentialFilters = {
    capacities: allCapacities.filter(c => rezidentialSlugs.capacitySlugs.includes(c.slug)),
    energyClasses: allEnergyClasses.filter(c => rezidentialSlugs.energySlugs.includes(c.slug))
  };



  const comercialFilters = {
    capacities: allCapacities.filter(c => comercialSlugs.capacitySlugs.includes(c.slug)),
    energyClasses: allEnergyClasses.filter(c => comercialSlugs.energySlugs.includes(c.slug))
  };

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
        <SidebarMegaMenu
          categories={categories}
          brands={brands}
          rezidentialFilters={rezidentialFilters}
          comercialFilters={comercialFilters}
        />
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
