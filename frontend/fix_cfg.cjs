const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const eurocool = await prisma.supplier.findFirst({ where: { name: { contains: 'EUROCOOL' } } });
    if (eurocool) {
        const cfg = eurocool.crawlerConfig;
        cfg.paginationSelector = '.wd-load-more, a.next.page-numbers, a.next, .load-more-button';
        await prisma.supplier.update({
            where: { id: eurocool.id },
            data: { crawlerConfig: cfg }
        });
        console.log("Updated config:", cfg);
    }
}
run().catch(console.error).finally(()=>prisma.$disconnect());
