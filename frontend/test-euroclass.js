const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const p = await prisma.unmappedSupplierProduct.findMany({
        where: { supplierId: 10 }, // We assume Euroclass might be ID 10 or test fetching Euroclass
        include: { supplier: true },
        take: 5
    });
    console.log("Euroclass unmapped products:");
    for (const d of p) {
        if (d.supplier.name.toLowerCase().includes('euroclass')) {
            console.log(d.extractedName, " => P(DB):", d.extractedPrice, " URL:", d.supplierProductUrl);
        }
    }

    const supp = await prisma.supplier.findFirst({ where: { name: { contains: 'Euroclass', mode: 'insensitive' } } });
    if (supp) {
       console.log("Supplier Config:\n", JSON.stringify(supp.crawlerConfig, null, 2));
    }
    
    await prisma.$disconnect();
}
check();
