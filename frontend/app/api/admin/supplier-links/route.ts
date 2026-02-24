import { NextResponse } from 'next/server';
import { getWooCommerceProducts, updateWooCommerceProduct } from '@/lib/woo-admin';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

// POST: Link or Unlink a product to a supplier
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, supplierId, action, price, supplierSku } = body;
        // action: 'link' | 'unlink'

        if (!productId || !supplierId) {
            return NextResponse.json({ success: false, message: 'Missing IDs' }, { status: 400 });
        }

        // 1. Fetch current product data (to get existing meta)
        const products = await getWooCommerceProducts({ include: [productId] });
        if (!products || products.length === 0) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }
        const product = products[0];

        // 2. Parse existing meta
        const metaKey = '_climatic_supplier_data';
        const existingMeta = product.meta_data.find((m: any) => m.key === metaKey);
        let supplierData: any[] = [];

        if (existingMeta && existingMeta.value) {
            try {
                // WC sometimes returns value as string, sometimes parsed? Usually string if custom.
                supplierData = typeof existingMeta.value === 'string'
                    ? JSON.parse(existingMeta.value)
                    : existingMeta.value;

                if (!Array.isArray(supplierData)) supplierData = [];
            } catch (e) {
                supplierData = [];
            }
        }

        // 3. Modify Data
        if (action === 'unlink') {
            supplierData = supplierData.filter((s: any) => s.supplierId != supplierId);
        } else {
            // Link / Update
            // Check if already exists, update if so
            const existingIndex = supplierData.findIndex((s: any) => s.supplierId == supplierId);
            const newEntry = {
                supplierId: parseInt(supplierId),
                price: parseFloat(price) || 0,
                sku: supplierSku || '',
                updatedAt: new Date().toISOString()
            };

            if (existingIndex >= 0) {
                supplierData[existingIndex] = { ...supplierData[existingIndex], ...newEntry };
            } else {
                supplierData.push(newEntry);
            }
        }

        // 4. Save back to WC
        // We need to send stringified JSON usually for meta values if we want to ensure structure
        // But WC REST API V3 handles JSON in meta values if we don't force string. 
        // Safe bet: Send as array/object, WC JSON-encodes it.
        await updateWooCommerceProduct(productId, {
            meta_data: [
                {
                    key: metaKey,
                    value: supplierData
                }
            ]
        });

        return NextResponse.json({ success: true, count: supplierData.length });

    } catch (error) {
        console.error("Link Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update link' }, { status: 500 });
    }
}
