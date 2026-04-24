const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
    const deleted = await prisma.unmappedSupplierProduct.deleteMany({
        where: { supplierId: 12 } // 12 este Vexio
    });
    console.log(`Șters ${deleted.count} produse fantomă din Carantină.`);
    await prisma.$disconnect();
}
clean();
