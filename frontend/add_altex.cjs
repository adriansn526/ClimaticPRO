const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const crawlerConfig = {
        catalogUrls: ["https://altex.ro/aer-conditionat/cpl/"],
        productLinkSelector: "a[href*=\"/cpd/\"]",
        paginationSelector: "a[href*=\"/p/\"]",
        titleSelector: "h1",
        priceSelector: ".Price-int, .Price-current",
        stockSelector: ".text-green-600, .text-red-600, div[class*=\"Status\"]"
    };

    const supplierParams = {
        name: "ALTEX ROMANIA",
        cui: "RO2864518",
        contact: "Robot Altex",
        phone: "021 9196",
        email: "suport@altex.ro",
        address: "Bucuresti",
        websiteUrl: "https://altex.ro",
        active: true,
        crawlerConfig: crawlerConfig
    };

    let existing = await prisma.supplier.findFirst({ where: { name: { contains: 'ALTEX', mode: 'insensitive' } } });
    if (existing) {
        console.log("Altex already exists, updating config...");
        await prisma.supplier.update({
            where: { id: existing.id },
            data: supplierParams
        });
        console.log("Altex updated successfully!");
    } else {
        console.log("Creating Altex as a new supplier...");
        await prisma.supplier.create({
            data: supplierParams
        });
        console.log("Altex created successfully with scraping config!");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
