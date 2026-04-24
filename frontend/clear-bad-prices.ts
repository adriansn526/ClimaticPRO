import { PrismaClient } from '@prisma/client';
import { syncProductPricing } from './lib/repricer'; // IMPORTANT: We need to sync pricing after deleting the bad supplier link!

const prisma = new PrismaClient();
async function run() {
    const badLinks = await prisma.productSupplier.findMany({ where: { supplierId: 4, supplierPrice: { gt: 1000000 } } });
    console.log(`Found ${badLinks.length} bad links.`);
    
    for (const link of badLinks) {
         await prisma.productSupplier.delete({ where: { id: link.id } });
         // Recalculate B2B Product prices so Profit B2B updates instantly!
         await syncProductPricing(link.productId);
         console.log(`Deleted bad price for Product ${link.productId} and synced repricing.`);
    }
}
run();
