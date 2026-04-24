import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppWidget from '@/components/shared/WhatsAppWidget';
import GoogleAds from '@/components/shared/GoogleAds';
import {
    getWooCommerceCategories,
    getAllBrands,
    getAllProductsCached,
    generateCategoryFilters
} from '@/lib/woocommerce';

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch Menu Data Globally
    const [categories, brands, allProducts] = await Promise.all([
        getWooCommerceCategories(),
        getAllBrands(),
        getAllProductsCached()
    ]);

    // Derive Filters for MegaMenu (Dynamic per category)
    const categoryFilters = generateCategoryFilters(allProducts, categories);

    return (
        <>
            <GoogleAds />
            <Header
                categories={categories}
                brands={brands}
                categoryFilters={categoryFilters}
            />
            {children}
            <Footer />
            <WhatsAppWidget />
        </>
    );
}
