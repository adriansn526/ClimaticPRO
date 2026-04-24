const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const konnectSupplier = await prisma.supplier.findFirst({ where: { name: { contains: 'konnect', mode: 'insensitive' } }});
    if (!konnectSupplier) return console.log('Supplier not found');

    console.log('Supplier ID:', konnectSupplier.id);
    console.log('Crawler Config:', konnectSupplier.crawlerConfig);

    const extracted = await prisma.unmappedSupplierProduct.findMany({
        where: { supplierId: konnectSupplier.id, extractedName: { contains: 'GWH12AAB', mode: 'insensitive' } },
        select: { extractedName: true, extractedPrice: true, supplierProductUrl: true }
    });

    console.log('Found Unmapped:', extracted);
}

main().catch(console.error).finally(() => prisma.$disconnect());
