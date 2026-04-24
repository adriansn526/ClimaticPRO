const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const vexioProducts = await prisma.productSupplier.findMany({
        where: { supplierId: 12 },
        include: { product: true }
    });
    console.log(`Vexio are ${vexioProducts.length} asocieri curente active.`);
    if (vexioProducts.length > 0) {
       console.log("Primul linkat:", vexioProducts[0].product.name, "->", vexioProducts[0].supplierProductUrl);
    }
    await prisma.$disconnect();
}
check();
