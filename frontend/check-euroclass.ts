import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const s = await prisma.supplier.findUnique({ where: { id: 4 }, include: { products: true } });
    console.log(`Supplier ${s?.name} has ${s?.products.length} products mapped.`);
    const badPrices = await prisma.productSupplier.count({ where: { supplierId: 4, supplierPrice: { gt: 1000000 } }});
    console.log(`Bad prices (>1M): ${badPrices}`);
}
run();
