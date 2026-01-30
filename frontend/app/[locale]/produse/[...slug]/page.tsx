import { getTranslations } from 'next-intl/server';
import { getWooCommerceCategories, getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/products/ProductCard';
import ProductFilter from '@/components/products/ProductFilter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = {
    title: 'Produse | ClimaticPro',
    description: 'Gama completă de aparate de aer condiționat Daikin, Gree, Midea. Prețuri competitive și instalare profesională.',
};

interface ArchivePageProps {
    params: { slug?: string[] };
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ArchivePage({ params, searchParams }: ArchivePageProps) {
    // Determine category from URL path (clean URL) or search params (fallback)
    const slugCategory = params.slug && params.slug.length > 0 ? params.slug[params.slug.length - 1] : undefined;
    const category = slugCategory || (typeof searchParams.category === 'string' ? searchParams.category : undefined);

    const minPrice = typeof searchParams.minPrice === 'string' ? Number(searchParams.minPrice) : undefined;
    const maxPrice = typeof searchParams.maxPrice === 'string' ? Number(searchParams.maxPrice) : undefined;
    const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;

    // Define sort order
    let orderby: { field: string; order: string } | undefined;
    if (sort === 'price_asc') orderby = { field: 'PRICE', order: 'ASC' };
    if (sort === 'price_desc') orderby = { field: 'PRICE', order: 'DESC' };
    if (sort === 'popularity') orderby = { field: 'TOTAL_SALES', order: 'DESC' };
    if (sort === 'newest') orderby = { field: 'DATE', order: 'DESC' };

    const [categories, { products }] = await Promise.all([
        getWooCommerceCategories(),
        getProducts({
            category,
            minPrice,
            maxPrice,
            search,
            orderby,
        }, 12)
    ]);

    const breadcrumbs = [
        { label: 'Acasă', href: '/' },
        { label: 'Produse', href: '/produse' }
    ];

    if (params.slug) {
        let currentPath = '/produse';
        params.slug.forEach((segment) => {
            currentPath += `/${segment}`;
            const matchedCat = categories.find(c => c.slug === segment);
            const label = matchedCat ? matchedCat.name : segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            breadcrumbs.push({ label, href: currentPath });
        });
    } else if (category) {
        const catName = categories.find(c => c.slug === category)?.name || category;
        breadcrumbs.push({ label: catName });
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b mb-8">
                <div className="container mx-auto px-4 py-4">
                    <Breadcrumbs items={breadcrumbs} />
                </div>
            </div>

            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <ProductFilter categories={categories} />
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                                {products.length} Produse găsite
                            </h1>

                            {/* Sort Dropdown would go here - simplified for now */}
                            {/* <SortDropdown /> */}
                        </div>

                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-10 rounded-lg shadow-sm text-center">
                                <p className="text-gray-500 text-lg">Nu am găsit produse care să corespundă criteriilor selectate.</p>
                            </div>
                        )}

                        {/* Pagination Controls could be added here */}
                    </div>
                </div>
            </div>
        </main>
    );
}
