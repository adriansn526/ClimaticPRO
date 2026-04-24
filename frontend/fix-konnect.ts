import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixKonnect() {
    const suppliers = await prisma.supplier.findMany({ where: { name: { contains: "KONNECT" } } });
    if(suppliers.length > 0) {
        const supp = suppliers[0];
        let cfg: any = supp.crawlerConfig;
        
        console.log("Old Config Price Selector:", cfg.priceSelector);
        
        // CFG
        cfg.priceSelector = ".product-price, .price-new, .price";
        
        await prisma.supplier.update({
            where: { id: supp.id },
            data: { crawlerConfig: cfg }
        });
        
        console.log("New Config Price Selector:", cfg.priceSelector);
    } else {
        console.log("not found");
    }
}

fixKonnect().catch(console.error).finally(()=>prisma.$disconnect());
