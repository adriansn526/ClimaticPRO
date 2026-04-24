const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const eurocool = await prisma.supplier.findFirst({ where: { name: { contains: 'EUROCOOL' } } });
    if (eurocool) {
        const cfg = eurocool.crawlerConfig;
        if (!cfg.catalogUrls.includes("https://eurocool.ro/shop/")) {
            cfg.catalogUrls = ["https://eurocool.ro/shop/"]; // Replace specific category with global shop
        }
        await prisma.supplier.update({
            where: { id: eurocool.id },
            data: { crawlerConfig: cfg }
        });
        console.log("Updated config to global shop page:", cfg);
    }
}
run().catch(console.error).finally(()=>prisma.$disconnect());
