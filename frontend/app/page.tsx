import { getTranslations } from 'next-intl/server';
import { getBannereByLocatie } from '@/lib/bannere';
import { getWooCommerceCategories, getFeaturedProducts } from '@/lib/woocommerce';
import HeroSection from '@/components/home/HeroSection';
import SidebarMegaMenu from '@/components/home/SidebarMegaMenu';
import TrustBadges from '@/components/home/TrustBadges';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import FeaturedProducts from '@/components/products/FeaturedProducts';
import ServicesSection from '@/components/home/ServicesSection';
import WhyChooseSection from '@/components/home/WhyChooseSection';
import FinalCTA from '@/components/home/FinalCTA';

export async function generateMetadata() {
  const t = await getTranslations({ locale: 'ro', namespace: 'hero' });

  return {
    title: `${t('title')} | ClimaticPro - Gree, Daikin, Midea`,
    description: t('subtitle'),
    keywords: 'aer conditionat, instalare aer conditionat, gree, daikin, midea, bucuresti, climatizare',
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      type: 'website',
      locale: 'ro_RO',
    },
  };
}

export default async function HomePage() {
  const [banners, categories, featuredProducts] = await Promise.all([
    getBannereByLocatie('homepage_hero', 5),
    getWooCommerceCategories(),
    getFeaturedProducts(8),
  ]);
  
  return (
    <main className="min-h-screen">
      <HeroSection banners={banners}>
        <SidebarMegaMenu categories={categories} />
      </HeroSection>
      <TrustBadges />
      <CategoriesGrid />
      <FeaturedProducts products={featuredProducts} />
      <ServicesSection />
      <WhyChooseSection />
      <FinalCTA />
    </main>
  );
}
