const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking UnmappedSupplierProduct for Vexio...");
    const products = await prisma.unmappedSupplierProduct.findMany({
        where: { supplierId: 12 },
        take: 3
    });
    
    products.forEach((p, i) => {
        console.log(`\nProdus ${i+1}:`);
        console.log("Nume:", p.extractedName);
        console.log("Pret:", p.extractedPrice);
        console.log("Stoc:", p.extractedStock);
        console.log("URL:", p.supplierProductUrl);
    });
    
    // De asemenea afisam ce contine selectorul curent ca sa fiu sigur ca s-a salvat
    const supplier = await prisma.supplier.findUnique({where: {id: 12}});
    console.log("\nCurrent Crawler Config:", supplier.crawlerConfig);
    
    await prisma.$disconnect();
}
check();
