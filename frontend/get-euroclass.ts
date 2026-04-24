import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const p = await prisma.productSupplier.findFirst({
         where: { supplierPrice: { gt: 1000000 } },
         include: { product: true, supplier: true }
    });
    console.log(p);
}
run();
