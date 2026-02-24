import { getTranslations } from 'next-intl/server';
import { getWooCommerceCategories, getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/products/ProductCard';
import ProductFilter from '@/components/products/ProductFilter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Pagination from '@/components/ui/Pagination'; // Import Pagination

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
    const after = typeof searchParams.after === 'string' ? searchParams.after : undefined;
    const brand = typeof searchParams.brand === 'string' ? searchParams.brand : undefined;
    const btuParam = typeof searchParams.btu === 'string' ? searchParams.btu : undefined;
    const energyParam = typeof searchParams.energy === 'string' ? searchParams.energy : undefined;

    // Define sort order
    let orderby: { field: string; order: string } | undefined;
    if (sort === 'price_asc') orderby = { field: 'PRICE', order: 'ASC' };
    if (sort === 'price_desc') orderby = { field: 'PRICE', order: 'DESC' };
    if (sort === 'popularity') orderby = { field: 'TOTAL_SALES', order: 'DESC' };
    if (sort === 'newest') orderby = { field: 'DATE', order: 'DESC' };

    const [categories, { products, pageInfo, filters }] = await Promise.all([
        getWooCommerceCategories(),
        getProducts({
            category,
            minPrice,
            maxPrice,
            search,
            orderby,
            brand: brand?.split(','),
            btu: btuParam?.split(','),
            energy: energyParam?.split(','),
        }, 24, after, 'ARCHIVE_SLUG')
    ]);

    console.log(`[DEBUG] ArchiveSlug Rendered. Products: ${products.length}. Total: ${pageInfo?.total}`);

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
        breadcrumbs.push({ label: catName, href: `/produse/${category}` });
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
                        <ProductFilter categories={categories} filters={filters} total={pageInfo?.total} selectedCategory={category} />
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex flex-col mb-6">
                            {/* SEO Title */}
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                {category ? (categories.find(c => c.slug === category)?.name || 'Produse') : 'Toate Produsele'}
                            </h1>

                            <div className="flex flex-col sm:flex-row justify-between items-center">
                                <p className="text-sm font-medium text-gray-500 mb-4 sm:mb-0">
                                    {products.length} produse afișate
                                </p>

                                {/* Sort Dropdown would go here - simplified for now */}
                                {/* <SortDropdown /> */}
                            </div>
                        </div>

                        {/* Semantic Section Title for Grid */}
                        <h2 className="sr-only">Lista de produse</h2>

                        {products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                    {products.map((product, index) => (
                                        <ProductCard key={product.id} product={product} priority={index < 4} />
                                    ))}
                                </div>
                                <div className="text-center text-sm text-gray-500 mt-4 mb-2">
                                    Afișez {products.length} din {pageInfo?.total || '???'} produse
                                </div>
                                <Pagination pageInfo={pageInfo} />
                            </>
                        ) : (
                            <div className="bg-white p-10 rounded-lg shadow-sm text-center">
                                <p className="text-gray-500 text-lg">Nu am găsit produse care să corespundă criteriilor selectate.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
