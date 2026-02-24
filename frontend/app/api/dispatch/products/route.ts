import { NextResponse } from 'next/server';
import { getWooCommerceProducts, getWooCommerceCategories } from '@/lib/woo-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        // 1. Fetch Categories (Only once, or filtered)
        // Ideally we cache this or fetch strictly needed ones. 
        // For B2B we might only want 'Materiale', 'Accesorii'.

        // 2. Fetch Products
        let params: any = {
            per_page: 50,
            status: 'publish',
            stock_status: 'instock'
        };

        if (category && category !== 'all') {
            params.category = category; // Logic to map slug to ID might be needed if WC API requires ID
        }
        if (search) {
            params.search = search;
        }

        const [products, categories] = await Promise.all([
            getWooCommerceProducts(params),
            getWooCommerceCategories({ per_page: 20, hide_empty: true })
        ]);

        // 3. Transform for B2B View
        const mappedProducts = products
            .filter((p: any) => {
                // EXCLUSION LOGIC: Filter out services or installation products
                const nameLower = p.name.toLowerCase();
                const catLower = (p.categories[0]?.name || '').toLowerCase();

                // Exclude words like 'instalare', 'montaj' unless it's a kit like "Kit Instalare" (which is a product)
                // But user wants to exclude "Instalare aer conditionat" service.
                // Usually services don't have weight or dimensions, or are in specific category.
                // For now, strict filter on name for 'Instalare' if it's likely a service.

                if (catLower.includes('instalare') || catLower.includes('reparatii')) return false;

                // Specific exclusions based on user feedback
                if (nameLower.startsWith('instalare ') || nameLower.startsWith('reparatie ')) return false;

                return true;
            })
            .map((p: any) => {
                const regular = parseFloat(p.regular_price || p.price || 0);
                const sale = parseFloat(p.sale_price || 0);

                // Partner Logic: User requested REAL prices only. 
                // We use Sale price if active, otherwise Regular.
                const finalPrice = sale > 0 ? sale : regular;

                // Attributes Mapping
                const brand = p.attributes.find((a: any) => a.name.toLowerCase() === 'brand' || a.name.toLowerCase() === 'producator')?.options[0] || 'Generic';
                const btu = p.attributes.find((a: any) => a.name.toLowerCase().includes('btu') || a.name.toLowerCase().includes('capacitate'))?.options[0] || '';
                const energy_class = p.attributes.find((a: any) => a.name.toLowerCase().includes('clasa') || a.name.toLowerCase().includes('energetic'))?.options[0] || '';

                // Supplier Data
                const supplierMeta = p.meta_data.find((m: any) => m.key === '_climatic_supplier_data');
                const suppliers = supplierMeta ? (typeof supplierMeta.value === 'string' ? JSON.parse(supplierMeta.value) : supplierMeta.value) : [];

                return {
                    id: p.id,
                    name: p.name,
                    category: p.categories[0]?.slug || 'general',
                    category_name: p.categories[0]?.name || 'General',
                    price: regular,
                    pro_price: finalPrice,
                    unit: 'buc',
                    // Logic: If manage_stock is true, use quantity. If false/null, but status is instock, return 'in_stock' string.
                    stock: p.manage_stock ? (p.stock_quantity || 0) : 'in_stock',
                    stock_status: p.stock_status,
                    image: p.images[0]?.src || null, // Allow null to fallback
                    brand,
                    btu,
                    energy_class,
                    suppliers // Include Linked Suppliers
                };
            });

        const relevantCategorySlugs = new Set<string>();
        mappedProducts.forEach((p: any) => {
            relevantCategorySlugs.add(p.category);
        });

        // 4. Transform Categories
        const mappedCategories = categories
            .filter((c: any) => {
                if (c.name.toLowerCase().includes('instalare') || c.name.toLowerCase().includes('reparatie')) return false;
                return relevantCategorySlugs.has(c.slug);
            })
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                slug: c.slug
            }));

        return NextResponse.json({
            success: true,
            products: mappedProducts,
            categories: mappedCategories
        });

    } catch (error) {
        console.error("API Error", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch B2B data' }, { status: 500 });
    }
}
