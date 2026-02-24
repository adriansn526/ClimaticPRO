import { getWooCommerceCategories, getProducts, getProductBySlug, getProductById } from '@/lib/woocommerce';
import ProductCard from '@/components/products/ProductCard';
import ProductFilter from '@/components/products/ProductFilter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PromotionalBanner from '@/components/products/PromotionalBanner';
import ViewToggle from '@/components/products/ViewToggle';
import SortDropdown from '@/components/products/SortDropdown';
import Pagination from '@/components/ui/Pagination';
import BrandFilterBar from '@/components/products/BrandFilterBar';

export const metadata = {
    title: 'Produse | ClimaticPro',
    description: 'Gama completă de aparate de aer condiționat Daikin, Gree, Midea. Prețuri competitive și instalare profesională.',
};

export const dynamic = 'force-dynamic';

interface ArchivePageProps {
    params: { slug?: string[] };
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ArchivePage({ params, searchParams }: ArchivePageProps) {
    // Determine category from URL path (clean URL) or search params (fallback)
    const slugCategory = params.slug && params.slug.length > 0 ? params.slug[params.slug.length - 1] : undefined;
    const category = slugCategory || (typeof searchParams.category === 'string' ? searchParams.category : undefined);

    // Helper to get first valid param from a list of keys
    const getParam = (keys: string[]) => {
        for (const key of keys) {
            const val = searchParams[key];
            if (typeof val === 'string') return val;
            if (Array.isArray(val) && val.length > 0) return val[0];
        }
        return undefined;
    };

    const minPrice = typeof searchParams.minPrice === 'string' ? Number(searchParams.minPrice) : undefined;
    const maxPrice = typeof searchParams.maxPrice === 'string' ? Number(searchParams.maxPrice) : undefined;
    const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;

    // Improved Parameter Mapping
    const brand = getParam(['brand', 'pa_brand', 'producator']);
    const btuParam = getParam(['btu', 'pa_btu', 'pa_capacitate', 'capacitate']);
    const energyParam = getParam(['energy', 'clasa', 'pa_clasa_energie', 'pa_clasa-energetica', 'pa_clasa-de-energie']);
    const view = typeof searchParams.view === 'string' && searchParams.view === 'list' ? 'list' : 'grid';
    const after = typeof searchParams.after === 'string' ? searchParams.after : null;

    // Define sort order
    let orderby: { field: string; order: string } | undefined;
    if (sort === 'price_asc') orderby = { field: 'PRICE', order: 'ASC' };
    if (sort === 'price_desc') orderby = { field: 'PRICE', order: 'DESC' };
    if (sort === 'popularity') orderby = { field: 'TOTAL_SALES', order: 'DESC' };
    if (sort === 'newest') orderby = { field: 'DATE', order: 'DESC' };

    // Default to Popularity if no sort is specified
    if (!sort) {
        orderby = { field: 'TOTAL_SALES', order: 'DESC' };
    }

    const [categories, { products, pageInfo, filters }, offerProduct, installationProduct] = await Promise.all([
        getWooCommerceCategories(),
        getProducts({
            orderby: orderby, // Pass the default or selected sort
            category,
            search,
            minPrice,
            maxPrice,
            brand: brand?.split(','),
            btu: btuParam?.split(','),
            energy: energyParam?.split(','),
        }, 24, after, 'ARCHIVE_MAIN'),
        getProductBySlug('aparat-de-aer-conditionat-midea-xtreme-fresh-msagbu-12hrfn8-qrd1gw-mox133-12hfn8-qrd1gw-inverter-12000-btu'),
        getProductById(11170)
    ]);

    console.log(`[DEBUG] ArchivePage Rendered. Products: ${products.length}. Total: ${pageInfo?.total}`);

    // Banner Logic with Fallbacks
    let bannerProduct = offerProduct;
    if (!bannerProduct) {
        // Fallback 1: On Sale
        const saleData = await getProducts({ onSale: true }, 1);
        bannerProduct = saleData.products[0];
    }
    if (!bannerProduct) {
        // Fallback 2: Generic (Newest)
        const genericData = await getProducts({}, 1);
        bannerProduct = genericData.products[0];
    }

    // Helper to map attributes (term -> name for UI)
    const mapAttrs = (attrs: any[]) => attrs ? attrs.map(a => ({ name: a.term, slug: a.slug, count: a.count })) : [];

    const breadcrumbs = [
        { label: 'Acasă', href: '/' },
        { label: 'Produse', href: '/produse' }
    ];

    // ... (rest of breadcrumbs logic)
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
                    <div className="flex-1 min-w-0">
                        <PromotionalBanner product={bannerProduct} installationProduct={installationProduct} />

                        <div className="w-full overflow-hidden">
                            <BrandFilterBar brands={filters.brands} selectedBrand={brand} />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h1 className="text-sm font-medium text-gray-500">
                                {products.length} produse afișate
                            </h1>

                            <div className="flex items-center gap-4">
                                <ViewToggle />
                                <SortDropdown />
                            </div>
                        </div>

                        {products.length > 0 ? (
                            <>
                                <div className={`${view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4' : 'flex flex-col gap-4'}`}>
                                    {products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            layout={view}
                                        />
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
