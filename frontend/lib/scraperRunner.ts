import { getPrisma } from '@/lib/prisma';
import { fuzzyMatchProduct } from '@/lib/matcher';
import { syncProductPricing } from '@/lib/repricer';

const prisma = getPrisma();

/** Round to 2 decimals and compare — avoids floating-point false positives */
function priceActuallyChanged(oldPrice: number, newPrice: number): boolean {
    return Math.round(oldPrice * 100) !== Math.round(newPrice * 100);
}

export async function runScraperTask(jobId: number, supplier: any, config: any) {
    try {
        const { runUniversalScraper } = await import('@/lib/scraper');
        
        await prisma.scraperJob.update({
            where: { id: jobId },
            data: { progress: 'Browser lansat. Se scanează paginile din catalog pentru linkuri...' }
        });

        const scraperConfig = { ...config, useProxy: supplier.useProxy === true };
        const scrapedItems = await runUniversalScraper(scraperConfig);

        if (!scrapedItems || scrapedItems.length === 0) {
            await prisma.scraperJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    progress: 'Robotul nu a găsit produse. Verificați selectorii.',
                    resultStats: { total: 0, autoMapped: 0, unmapped: 0 }
                }
            });
            return;
        }

        await prisma.scraperJob.update({
            where: { id: jobId },
            data: { progress: `Au fost extrase ${scrapedItems.length} produse unice. Se asociază (Smart Match)...` }
        });

        const dbProductsRaw = await prisma.b2BProduct.findMany({
            select: { id: true, name: true, sku: true }
        });

        let autoMappedStats = 0;
        let unmappedStats = 0;
        const affectedProductIds = new Set<number>();

        for (const item of scrapedItems) {
            const existingProductLink = await prisma.productSupplier.findFirst({
               where: { supplierId: supplier.id, supplierProductUrl: item.url }
            });

            if (existingProductLink) {
               const changed = priceActuallyChanged(existingProductLink.supplierPrice, item.price);
               let isOscillation = false;
               if (changed) {
                   // Anti-oscillation: check if price is just bouncing back to the previous value
                   const prevHistory = await prisma.supplierPriceHistory.findFirst({
                       where: { productSupplierId: existingProductLink.id },
                       orderBy: { recordedAt: 'desc' },
                       take: 1
                   });
                   isOscillation = !!(prevHistory && Math.round(prevHistory.oldPrice * 100) === Math.round(item.price * 100));
                   
                   if (!isOscillation) {
                       await prisma.supplierPriceHistory.create({
                           data: {
                               productSupplierId: existingProductLink.id,
                               oldPrice: existingProductLink.supplierPrice,
                               newPrice: item.price
                           }
                       });
                   }
               }
               // If oscillation detected: only update stock & timestamp, keep supplierPrice stable
               await prisma.productSupplier.update({
                   where: { id: existingProductLink.id },
                   data: {
                       ...((!changed || isOscillation) ? {} : { supplierPrice: item.price, priceLastChangedAt: new Date() }),
                       supplierStock: item.stock,
                       lastScrapedAt: new Date(),
                   }
               });
               affectedProductIds.add(existingProductLink.productId);
               autoMappedStats++;
               continue;
            }

            const match = fuzzyMatchProduct(item.title, dbProductsRaw, 0.95);

            if (match.matchedProductId) {
                const matchId = match.matchedProductId;
                
                const alreadyLinked = await prisma.productSupplier.findUnique({
                     where: { productId_supplierId: { productId: matchId, supplierId: supplier.id } }
                });

                if (alreadyLinked) {
                     const changed = priceActuallyChanged(alreadyLinked.supplierPrice, item.price);
                     let isOscillation = false;
                     if (changed) {
                         // Anti-oscillation: skip if price is bouncing back
                         const prevHistory = await prisma.supplierPriceHistory.findFirst({
                             where: { productSupplierId: alreadyLinked.id },
                             orderBy: { recordedAt: 'desc' },
                             take: 1
                         });
                         isOscillation = !!(prevHistory && Math.round(prevHistory.oldPrice * 100) === Math.round(item.price * 100));
                         
                         if (!isOscillation) {
                             await prisma.supplierPriceHistory.create({
                                 data: {
                                     productSupplierId: alreadyLinked.id,
                                     oldPrice: alreadyLinked.supplierPrice,
                                     newPrice: item.price
                                 }
                             });
                         }
                     }
                     // If oscillation: only update stock & timestamp, keep supplierPrice stable
                     await prisma.productSupplier.update({
                         where: { productId_supplierId: { productId: matchId, supplierId: supplier.id } },
                         data: { 
                             supplierProductUrl: item.url, 
                             ...((!changed || isOscillation) ? {} : { supplierPrice: item.price, priceLastChangedAt: new Date() }),
                             supplierStock: item.stock, 
                             lastScrapedAt: new Date(),
                         }
                     });
                } else {
                     await prisma.productSupplier.create({
                         data: {
                             productId: matchId,
                             supplierId: supplier.id,
                             supplierProductUrl: item.url,
                             supplierPrice: item.price,
                             supplierStock: item.stock
                         }
                     });
                }
                affectedProductIds.add(matchId);
                autoMappedStats++;
            } else {
                await prisma.unmappedSupplierProduct.upsert({
                  where: { supplierProductUrl: item.url },
                  update: { 
                      extractedName: item.title,  extractedPrice: item.price, extractedStock: item.stock, lastScrapedAt: new Date(),
                      status: "pending", similarityScore: match.score * 100, suggestedProductId: match.suggestedProductId
                  },
                  create: { 
                      supplierId: supplier.id, supplierProductUrl: item.url, extractedName: item.title, extractedPrice: item.price, 
                      extractedStock: item.stock, similarityScore: match.score * 100, suggestedProductId: match.suggestedProductId
                  }
                });
                unmappedStats++;
            }
        }

        // Repricing Engine Hook
        if (affectedProductIds.size > 0) {
            await prisma.scraperJob.update({
                where: { id: jobId },
                data: { progress: `Se aplică regulile automate de preț pe ${affectedProductIds.size} produse interne...` }
            });
            for (const pId of Array.from(affectedProductIds)) {
                await syncProductPricing(pId);
            }
        }

        await prisma.scraperJob.update({
            where: { id: jobId },
            data: {
                status: 'completed',
                progress: 'Căutare și asociere încheiată cu succes!',
                resultStats: {
                    total: scrapedItems.length,
                    autoMapped: autoMappedStats,
                    unmapped: unmappedStats
                }
            }
        });

        console.log(`[Scraper API] Gata: Job=${jobId}, Total=${scrapedItems.length}, Auto=${autoMappedStats}, Unmapped=${unmappedStats}`);

    } catch (error: any) {
        console.error(`[Scraper API] JOB ERROR ${jobId}:`, error);
        await prisma.scraperJob.update({
            where: { id: jobId },
            data: {
                status: 'error',
                progress: 'Eroare neașteptată de procesare.',
                errorLog: error.message || String(error)
            }
        }).catch(e => console.error("Eroare la marcarea erorii in DB", e));
    }
}
