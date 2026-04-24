const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVexioFinal() {
    try {
        const vexio = await prisma.supplier.findFirst({ where: { name: { equals: 'Vexio', mode: 'insensitive' } } });
        if(vexio) {
            const config = vexio.crawlerConfig;
            
            // CSS classes extracted directly from live proxy session
            config.priceSelector = '#price-value';
            config.stockSelector = '.availability';
            
            await prisma.supplier.update({
                where: { id: vexio.id },
                data: { crawlerConfig: config }
            });
            console.log("✅ Vexio DOM Selectors updated to exact IDs: #price-value and .availability");
        }
        
        // Wipe quarantine to ensure a clean slate
        const deleted = await prisma.unmappedSupplierProduct.deleteMany({
            where: { supplierId: vexio.id }
        });
        console.log(`Șters ${deleted.count} produse din Carantină.`);
        
    } catch(e) {
        console.error("Eroare:", e);
    } finally {
        await prisma.$disconnect();
    }
}
fixVexioFinal();
