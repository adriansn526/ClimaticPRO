import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ success: true, products: [] });
    }

    try {
        const products = await searchProducts(query);

        // Transform for UI
        const mappedProducts = products.map((p: any) => ({
            id: p.databaseId,
            slug: p.slug,
            name: p.name,
            price: p.price,
            salePrice: p.salePrice,
            stockStatus: p.stockStatus,
            image: p.image?.sourceUrl,
            brand: p.allPaBrand?.nodes?.[0]?.name || null
        }));

        return NextResponse.json({ success: true, products: mappedProducts });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
