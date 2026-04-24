import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWooCommerceProducts } from '@/lib/woo-admin';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        let page = 1;
        let hasMore = true;
        let syncedCount = 0;

        console.log("Starting full B2B product sync via WooCommerce REST API...");

        while (hasMore) {
            console.log(`Fetching page ${page} from WooCommerce...`);
            const products = await getWooCommerceProducts({ per_page: 100, page });

            if (!products || products.length === 0) {
                hasMore = false;
                break;
            }

            for (const p of products) {
                const skuStr = p.sku ? String(p.sku) : null;
                const rawPrice = p.price ? parseFloat(p.price) : 0;

                try {
                    const existingProduct = await prisma.b2BProduct.findUnique({
                        where: { slug: p.slug }
                    });

                    const isManageStock = p.manage_stock === true;
                    let mappedStock = 0;
                    if (isManageStock) {
                        mappedStock = p.stock_quantity !== null && p.stock_quantity !== undefined ? parseFloat(p.stock_quantity) : 0;
                    } else {
                        mappedStock = p.stock_status === 'instock' ? 10 : 0; // fallback if no tracking
                    }
                    
                    const newPriceB2B = rawPrice;
                    const imgStr = p.images && p.images.length > 0 ? p.images[0].src : null;

                    if (existingProduct) {
                        const shouldUpdatePrices = !existingProduct.isPriceOverridden;
                        
                        await prisma.b2BProduct.update({
                            where: { id: existingProduct.id },
                            data: {
                                name: p.name,
                                sku: skuStr,
                                ...(shouldUpdatePrices && {
                                    priceRetail: rawPrice,
                                    priceB2B: newPriceB2B,
                                }),
                                stock: mappedStock,
                                manageStock: isManageStock,
                                image: imgStr,
                                description: p.description || '',
                                attributes: p.attributes && Array.isArray(p.attributes) ? p.attributes : null,
                            }
                        });
                    } else {
                        await prisma.b2BProduct.create({
                            data: {
                                name: p.name,
                                slug: p.slug,
                                sku: skuStr,
                                priceRetail: rawPrice,
                                priceB2B: newPriceB2B,
                                stock: mappedStock,
                                manageStock: isManageStock,
                                image: imgStr,
                                description: p.description || '',
                                attributes: p.attributes && Array.isArray(p.attributes) ? p.attributes : null,
                                unit: 'buc',
                                active: true,
                                isPriceOverridden: false
                            }
                        });
                    }
                    syncedCount++;
                } catch (dbErr) {
                    console.error(`Error upserting product ${p.slug}:`, dbErr);
                }
            }

            // Limit to roughly ~1000 items to prevent max-time execution on vercel optionally
            if (page >= 10) break;

            page++;
        }

        console.log(`Successfully synced ${syncedCount} B2B products.`);
        return NextResponse.json({ success: true, message: `Sync completat cu succes!`, count: syncedCount });

    } catch (error: any) {
        console.error('B2B Sync Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la sincronizarea produselor.', error: error.message }, { status: 500 });
    }
}
