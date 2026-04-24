import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';

const prisma = new PrismaClient();

// GET all B2B Products for Admin
export async function GET(request: Request) {
    try {
        // Verification (Admin Only)
        // const admin = await verifyToken(request);
        // if (!admin || admin.role !== 'admin') {
        //     return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        // }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const syncStatus = searchParams.get('syncStatus') || 'all';
        const brand = searchParams.get('brand') || 'all';
        const profitMarginWarning = searchParams.get('profitMarginWarning') === 'true';
        const sortField = searchParams.get('sortField') || 'createdAt';
        const sortDir = searchParams.get('sortDir') || 'desc';

        const skip = (page - 1) * limit;
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (status === 'active') {
             whereClause.active = true;
        } else if (status === 'inactive') {
             whereClause.active = false;
        }

        if (syncStatus === 'synced') {
             whereClause.syncToWooCommerce = true;
        } else if (syncStatus === 'not_synced') {
             whereClause.syncToWooCommerce = false;
        }
        
        const installStatus = searchParams.get('installStatus');
        if (installStatus === 'forced') {
             whereClause.forceInstallation = true;
        } else if (installStatus === 'optional') {
             whereClause.forceInstallation = false;
        }

        const titleContains = searchParams.get('titleContains');
        if (titleContains) {
             whereClause.name = { contains: titleContains, mode: 'insensitive' };
        }

        const marginValueMinParam = searchParams.get('marginValueMin');
        const marginValueMaxParam = searchParams.get('marginValueMax');
        if (marginValueMinParam || marginValueMaxParam) {
             const marginWhere: any = {};
             if (marginValueMinParam) {
                  const mMin = parseFloat(marginValueMinParam);
                  if (!isNaN(mMin)) marginWhere.gte = mMin;
             }
             if (marginValueMaxParam) {
                  const mMax = parseFloat(marginValueMaxParam);
                  if (!isNaN(mMax)) marginWhere.lte = mMax;
             }
             if (Object.keys(marginWhere).length > 0) {
                  whereClause.marginValue = marginWhere;
             }
        }

        const categoryIdsParam = searchParams.get('categoryIds');
        const supplierIdsParam = searchParams.get('supplierIds');
        const maxProfitMinParam = searchParams.get('maxProfitMin');
        const maxProfitMaxParam = searchParams.get('maxProfitMax');

        const getAllIds = searchParams.get('getAllIds') === 'true';

        // We handle advanced sorting/filtering that needs complex compute in RAM
        const needsRamCompute = ['profitB2B', 'stock', 'status', 'priceChanged'].includes(sortField) || profitMarginWarning || (categoryIdsParam && categoryIdsParam !== 'all') || (supplierIdsParam && supplierIdsParam !== 'all') || maxProfitMinParam || maxProfitMaxParam;

        // Prisma native sort if simply by name, price, date
        let orderByConfig: any = undefined;
        if (!needsRamCompute) {
             orderByConfig = { [sortField]: sortDir };
        }

        // If doing RAM compute, we fetch all matching filters (unpaginated from DB), compute, sort, and slice.
        // Otherwise we paginate in DB.
        const dbSkip = (needsRamCompute || getAllIds) ? undefined : skip;
        const dbTake = (needsRamCompute || getAllIds) ? undefined : limit;

        const [totalCount, rawProducts] = await prisma.$transaction([
            prisma.b2BProduct.count({ where: whereClause }),
            prisma.b2BProduct.findMany({
                where: whereClause,
                skip: dbSkip,
                take: dbTake,
                orderBy: orderByConfig,
                include: {
                    suppliers: {
                        include: {
                            supplier: { select: { name: true } }
                        }
                    }
                }
            })
        ]);

        let products = rawProducts.map(p => {
             // Compute metrics for RAM sorting
             let minSupplierPrice = Infinity;
             p.suppliers?.forEach(s => {
                  if (s.supplierPrice < minSupplierPrice) minSupplierPrice = s.supplierPrice;
             });
             
             let computedProfit = 0;
             if (minSupplierPrice !== Infinity) {
                  computedProfit = p.priceB2B - minSupplierPrice;
             }

             // Find most recent price change timestamp across all suppliers
             let latestPriceChange: Date | null = null;
             p.suppliers?.forEach((s: any) => {
                  if (s.priceLastChangedAt) {
                      const d = new Date(s.priceLastChangedAt);
                      if (!latestPriceChange || d > latestPriceChange) latestPriceChange = d;
                  }
             });

             return {
                 ...p,
                 computedProfit,
                 hasNegativeMargin: minSupplierPrice !== Infinity && p.priceB2B < minSupplierPrice,
                 computedStockStatus: p.suppliers?.some(s => ['1', 'in_stock'].includes(s.supplierStock)) ? 'in_stock' : 'out_of_stock',
                 latestPriceChange
             };
        });

        // Additional Filter: maxProfit range
        if (maxProfitMinParam || maxProfitMaxParam) {
             const profitMin = maxProfitMinParam ? parseFloat(maxProfitMinParam) : -Infinity;
             const profitMax = maxProfitMaxParam ? parseFloat(maxProfitMaxParam) : Infinity;
             if (!isNaN(profitMin) || !isNaN(profitMax)) {
                  products = products.filter(p => {
                       return p.computedProfit >= profitMin && p.computedProfit <= profitMax;
                  });
             }
        }

        // Additional Filter: Category JSON Array Contains (Supports Include/Exclude)
        if (categoryIdsParam && categoryIdsParam !== 'all') {
             const filterCatIds = categoryIdsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
             const excludeCategories = searchParams.get('categoryIdsExclude') === 'true';
             if (filterCatIds.length > 0) {
                 if (excludeCategories) {
                     // Exclude: show products NOT in these categories (or with no category)
                     products = products.filter(p => 
                         !Array.isArray(p.wooCategoryIds) || !(p.wooCategoryIds as number[]).some(id => filterCatIds.includes(id))
                     );
                 } else {
                     // Include: show products IN these categories
                     products = products.filter(p => 
                         Array.isArray(p.wooCategoryIds) && (p.wooCategoryIds as number[]).some(id => filterCatIds.includes(id))
                     );
                 }
             }
        }

        // Additional Filter: Suppliers Include/Exclude (Supports Multiple)
        if (supplierIdsParam && supplierIdsParam !== 'all') {
             const filterSupIds = supplierIdsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
             const excludeSuppliers = searchParams.get('supplierIdsExclude') === 'true';
             if (filterSupIds.length > 0) {
                 if (excludeSuppliers) {
                     products = products.filter(p => 
                         !p.suppliers || !p.suppliers.some(s => filterSupIds.includes(s.supplierId))
                     );
                 } else {
                     products = products.filter(p => 
                         p.suppliers && p.suppliers.some(s => filterSupIds.includes(s.supplierId))
                     );
                 }
             }
        }

        // Additional Filter: Profit Warning
        if (profitMarginWarning) {
             products = products.filter(p => p.hasNegativeMargin);
        }

        // In-Memory Sorting
        if (needsRamCompute) {
             products.sort((a, b) => {
                  let valA: any, valB: any;
                  if (sortField === 'profitB2B') {
                       valA = a.computedProfit; valB = b.computedProfit;
                  } else if (sortField === 'stock') {
                       valA = a.computedStockStatus === 'in_stock' ? 1 : 0;
                       valB = b.computedStockStatus === 'in_stock' ? 1 : 0;
                  } else if (sortField === 'status') {
                       valA = a.active ? 1 : 0; valB = b.active ? 1 : 0;
                  } else if (sortField === 'priceChanged') {
                       valA = a.latestPriceChange ? new Date(a.latestPriceChange).getTime() : 0;
                       valB = b.latestPriceChange ? new Date(b.latestPriceChange).getTime() : 0;
                  }
                  
                  if (valA < valB) return sortDir === 'asc' ? -1 : 1;
                  if (valA > valB) return sortDir === 'asc' ? 1 : -1;
                  return 0;
             });
        }

        // In-Memory Paginate if needed
        const total = needsRamCompute ? products.length : totalCount;

        if (getAllIds) {
             return NextResponse.json({ success: true, ids: products.map(p => p.id) });
        }

        if (needsRamCompute) {
             products = products.slice(skip, skip + limit);
        }

        // Get global categories (Obsolete, but keeping structure for compatibility if needed. Actually we use wooCategories now)
        const categories: any[] = [];

        // Get global metrics to avoid UI breaking when paginating
        const metricsCount = await prisma.b2BProduct.groupBy({
            by: ['active'],
            _count: { active: true }
        });
        
        let activeCount = 0;
        let inactiveCount = 0;

        metricsCount.forEach(m => {
            if (m.active) activeCount = m._count.active;
            else inactiveCount = m._count.active;
        });

        // Count REAL price changes in last 24h (where price actually differs by > 1 RON)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        const recentHistory = await prisma.supplierPriceHistory.findMany({
            where: { recordedAt: { gte: oneDayAgo } },
            select: { oldPrice: true, newPrice: true, productSupplierId: true }
        });
        // Only count entries where price genuinely changed (>1 RON difference)
        const realChanges = recentHistory.filter(h => Math.abs(h.newPrice - h.oldPrice) > 1);
        const priceChangedCount = new Set(realChanges.map(h => h.productSupplierId)).size;

        return NextResponse.json({ 
            success: true, 
            products,
            total,
            totalPages: Math.ceil(total / limit),
            page,
            categories,
            metrics: {
                total: activeCount + inactiveCount,
                active: activeCount,
                inactive: inactiveCount,
                priceChangedCount
            }
        });
    } catch (error) {
        console.error('B2B Admin GET Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la preluare produse.' }, { status: 500 });
    }
}

// POST create a new B2B Product
export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Validation checks...
        if (!data.name || !data.priceB2B || !data.slug) {
            return NextResponse.json({ success: false, message: 'Nume, Preț B2B și Slug sunt obligatorii.' }, { status: 400 });
        }

        const newProduct = await prisma.b2BProduct.create({
            data: {
                name: data.name,
                slug: data.slug,
                sku: data.sku || null,
                capacity: data.capacity || null,
                priceB2B: parseFloat(data.priceB2B),
                priceRetail: data.priceRetail ? parseFloat(data.priceRetail) : null,
                stock: data.stock ? parseFloat(data.stock) : 0,
                unit: data.unit || 'buc',
                image: data.image || null,
                active: data.active !== undefined ? data.active : true,
            }
        });

        return NextResponse.json({ success: true, product: newProduct });
    } catch (error) {
        console.error('B2B Admin POST Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la adăugarea produsului.' }, { status: 500 });
    }
}

// PUT update an existing B2B Product or toggling active status
export async function PUT(request: Request) {
    try {
        const data = await request.json();

        // Handle Bulk Actions
        if (data.action === 'bulk') {
             const { productIds, bulkUpdates } = data;
             if (!productIds || !Array.isArray(productIds)) {
                  return NextResponse.json({ success: false, error: 'Invalid productIds' }, { status: 400 });
             }

             // We construct standard update payload from bulk
             const updateData: any = {};
             if (bulkUpdates.wooCategoryIds !== undefined) updateData.wooCategoryIds = bulkUpdates.wooCategoryIds;
             if (bulkUpdates.marginType !== undefined) updateData.marginType = bulkUpdates.marginType;
             if (bulkUpdates.marginValue !== undefined) updateData.marginValue = parseFloat(bulkUpdates.marginValue);
             if (bulkUpdates.syncToWooCommerce !== undefined) updateData.syncToWooCommerce = Boolean(bulkUpdates.syncToWooCommerce);
             if (bulkUpdates.forceInstallation !== undefined) updateData.forceInstallation = Boolean(bulkUpdates.forceInstallation);
             if (bulkUpdates.isPriceOverridden !== undefined) updateData.isPriceOverridden = Boolean(bulkUpdates.isPriceOverridden);
             
             await prisma.b2BProduct.updateMany({
                 where: { id: { in: productIds } },
                 data: updateData
             });

             // If margin was updated OR syncToWooCommerce was triggered globally in bulk, recalculate prices and sync 
             if (bulkUpdates.marginValue !== undefined || bulkUpdates.marginType !== undefined || bulkUpdates.syncToWooCommerce !== undefined || bulkUpdates.forceInstallation !== undefined || bulkUpdates.isPriceOverridden !== undefined) {
                 import('@/lib/repricer').then(async m => {
                      const { smartSyncB2BToWooCommerce } = await import('@/lib/woocommerce');
                      for (const id of productIds) {
                           // syncProductPricing will update price if needed, but it only pushes to woo if price changed.
                           // Since forceInstallation or syncToWooCommerce might have been toggled, we explicitly push to Woo.
                           const fullProduct = await prisma.b2BProduct.findUnique({ 
                               where: { id },
                               include: { suppliers: true }
                           });
                           if (fullProduct && fullProduct.syncToWooCommerce) {
                               let hasStock = false;
                               if (!fullProduct.manageStock) {
                                   hasStock = fullProduct.suppliers.some(s => s.supplierStock.includes('in_stock'));
                               } else {
                                   hasStock = fullProduct.stock > 0;
                               }
                               await smartSyncB2BToWooCommerce(fullProduct, hasStock).catch(console.error);
                           }
                           
                           // Also trigger Repricer to recalculate in case margin changed
                           m.syncProductPricing(id).catch(console.error);
                      }
                 }).catch(console.error);
             }

             return NextResponse.json({ success: true, count: productIds.length });
        }

        if (!data.id) {
            return NextResponse.json({ success: false, message: 'Product ID is missing.' }, { status: 400 });
        }

        const updatedProduct = await prisma.b2BProduct.update({
            where: { id: parseInt(data.id) },
            data: {
                name: data.name,
                slug: data.slug,
                sku: data.sku,
                capacity: data.capacity,
                priceB2B: data.priceB2B !== undefined ? parseFloat(data.priceB2B) : undefined,
                priceRetail: data.priceRetail !== undefined ? (data.priceRetail === null ? null : parseFloat(data.priceRetail)) : undefined,
                stock: data.stock !== undefined ? parseFloat(data.stock) : undefined,
                unit: data.unit,
                image: data.image,
                active: data.active !== undefined ? Boolean(data.active) : undefined,
                isPriceOverridden: data.isPriceOverridden !== undefined ? Boolean(data.isPriceOverridden) : undefined,
                marginValue: data.marginValue !== undefined ? parseFloat(data.marginValue) : undefined,
                marginType: data.marginType !== undefined ? data.marginType : undefined,
                wooCategoryIds: data.wooCategoryIds !== undefined ? data.wooCategoryIds : undefined,
                manageStock: data.manageStock !== undefined ? Boolean(data.manageStock) : undefined,
                syncToWooCommerce: data.syncToWooCommerce !== undefined ? Boolean(data.syncToWooCommerce) : undefined,
                // @ts-ignore
                forceInstallation: data.forceInstallation !== undefined ? Boolean(data.forceInstallation) : undefined,
            }
        });

        // Trigger WooCommerce Sync if requested
        if (updatedProduct.syncToWooCommerce) {
            const { smartSyncB2BToWooCommerce } = await import('@/lib/woocommerce');
            let hasStock = false;
            
            if (!updatedProduct.manageStock) {
                 const fullProduct = await prisma.b2BProduct.findUnique({
                     where: { id: updatedProduct.id },
                     include: { suppliers: true }
                 });
                 if (fullProduct && fullProduct.suppliers.length > 0) {
                     hasStock = fullProduct.suppliers.some(s => s.supplierStock.includes('in_stock'));
                 }
            } else {
                 hasStock = updatedProduct.stock > 0;
            }

            try {
                await smartSyncB2BToWooCommerce(updatedProduct, hasStock);
                const { revalidatePath } = await import('next/cache');
                revalidatePath(`/produs/${updatedProduct.slug}`, 'page');
                revalidatePath(`/produse`);
                console.log(`Successfully synced to Woo and invalidated cache for ${updatedProduct.slug}`);
            } catch (err) {
                console.error('Woo Sync Fail:', err);
            }
        }

        return NextResponse.json({ success: true, product: updatedProduct });
    } catch (error) {
        console.error('B2B Admin PUT Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la actualizarea produsului.' }, { status: 500 });
    }
}

// DELETE a B2B Product
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Product ID is missing.' }, { status: 400 });
        }

        await prisma.b2BProduct.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: 'Produs șters cu succes' });
    } catch (error) {
        console.error('B2B Admin DELETE Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la ștergerea produsului.' }, { status: 500 });
    }
}
