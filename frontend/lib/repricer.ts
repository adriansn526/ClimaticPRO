import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Recalculate and update the price of a B2B product based on its connected suppliers.
 * Rule: Identifies the lowest 'in_stock' supplier price and applies the `autoMargin` (e.g. -0.5 RON).
 * Skips the recalculation entirely if `isPriceOverridden` is true.
 */
export async function syncProductPricing(productId: number) {
    try {
        const product = await prisma.b2BProduct.findUnique({
            where: { id: productId },
            include: { suppliers: { include: { supplier: true } } }
        });

        if (!product) {
            console.log(`[Repricer] Product ${productId} not found.`);
            return;
        }

        // 1. Identify valid stock across suppliers
        const activeSuppliers = product.suppliers.filter(s => s.supplierStock.includes('in_stock') || s.supplierStock === 'in_stock');
        const hasActiveSuppliers = activeSuppliers.length > 0;
        
        let newPrice = product.priceB2B; // fallback to existing DB price
        let repricerMeta = product.repricerMeta;
        let lowestSupplierPrice = 0;

        if (product.isPriceOverridden) {
            console.log(`[Repricer] Product ${productId} (${product.name}) has manual price fixed. Passing through for stock sync logic only.`);
        } else {
            if (!hasActiveSuppliers) {
                console.log(`[Repricer] Product ${productId} has no active suppliers. Maintaining last known price.`);
            } else {
                const coreSuppliers = activeSuppliers.filter(s => s.supplier.supplierRole === 'CORE');
                const compSuppliers = activeSuppliers.filter(s => s.supplier.supplierRole === 'COMPETITOR');
                
                let targetBasePrice = 0;
                let minCorePrice = Infinity;
                if (coreSuppliers.length > 0) {
                    const corePrices = coreSuppliers.map(s => s.supplierPrice);
                    minCorePrice = Math.min(...corePrices);
                    targetBasePrice = product.marginType === 'PERCENT' ? minCorePrice * (1 + (product.marginValue || 0) / 100) : minCorePrice + (product.marginValue || 0);
                    lowestSupplierPrice = minCorePrice;
                }

                let minCompPrice = Infinity;
                let compUndercut = 0;
                let matchingCompName = "";

                if (compSuppliers.length > 0) {
                    for (const c of compSuppliers) {
                        if (c.supplierPrice < minCompPrice) {
                            minCompPrice = c.supplierPrice;
                            compUndercut = c.supplier.competitorUndercut ?? 0.50;
                            matchingCompName = c.supplier.name;
                        }
                    }
                    if(minCompPrice < lowestSupplierPrice || lowestSupplierPrice === 0) {
                        lowestSupplierPrice = minCompPrice;
                    }
                }

                if (compSuppliers.length > 0) {
                    // There are competitors. Undercut the lowest one.
                    newPrice = minCompPrice - compUndercut;
                    repricerMeta = `Auto-Matched: ${matchingCompName} (-${compUndercut} RON)`;
                } else if (coreSuppliers.length > 0) {
                    // Only CORE suppliers.
                    newPrice = targetBasePrice;
                    repricerMeta = `Adaos Standard CORE`;
                }

                newPrice = Math.round(newPrice * 100) / 100;
            }
        }

        const isB2BDiff = newPrice !== product.priceB2B;
        const isRetailDiff = newPrice !== product.priceRetail;
        const isMetaDiff = repricerMeta !== product.repricerMeta;

        if (isB2BDiff || isRetailDiff || isMetaDiff) {
            await prisma.b2BProduct.update({
                where: { id: productId },
                data: { 
                    priceB2B: newPrice,
                    priceRetail: newPrice,
                    repricerMeta: repricerMeta
                }
            });
            console.log(`[Repricer] Product ${productId} (${product.name}) synced. Cost Base: ${lowestSupplierPrice}. New Price (B2B & Retail): ${newPrice} (Margin: ${product.marginValue} ${product.marginType})`);
        } else {
            console.log(`[Repricer] Product ${productId}: Price is already optimal (${newPrice}).`);
        }

        // Push to WooCommerce if toggle is active, AND (price changed OR it's a fixed-price product that needs constant stock monitoring)
        const needsWooSync = (isB2BDiff || isRetailDiff) || product.isPriceOverridden;

        if (needsWooSync && product.syncToWooCommerce) {
            try {
                const { smartSyncB2BToWooCommerce } = await import('@/lib/woocommerce');
                const updatedProductPayload = { ...product, priceB2B: newPrice, priceRetail: newPrice };
                const hasStock = hasActiveSuppliers; 
                
                smartSyncB2BToWooCommerce(updatedProductPayload, hasStock)
                     .then(res => {
                         console.log(`[Repricer] Woo Sync Executed for ${productId}: ${res}`);
                         import('next/cache').then(({ revalidatePath }) => {
                             revalidatePath(`/produs/${product.slug}`, 'page');
                             revalidatePath(`/produse`); 
                         }).catch(e => console.log('Revalidate unsupported in this context.'));
                     })
                     .catch(err => console.error(`[Repricer] Woo Sync Fail for ${productId}:`, err));
            } catch (err) {
                console.error('[Repricer] Failed to trigger WooCommerce hook:', err);
            }
        }
        
    } catch (error) {
        console.error(`[Repricer Engine Error] Failed processing product ${productId}:`, error);
    }
}
