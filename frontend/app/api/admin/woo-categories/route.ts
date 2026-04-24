import { NextResponse } from 'next/server';
import { getWooCommerceCategories } from '@/lib/woocommerce';

export async function GET() {
    try {
        const categories = await getWooCommerceCategories();
        return NextResponse.json({ success: true, categories });
    } catch (error) {
        console.error('WooCommerce Categories API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
    }
}
