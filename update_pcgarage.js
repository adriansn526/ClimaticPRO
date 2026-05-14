const { PrismaClient } = require('./frontend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.supplier.findFirst({ where: { name: "PC Garage" } });
  if (existing) {
    const config = existing.crawlerConfig;
    config.useProxy = true; // Force use residential proxy
    
    // Also, pc garage specific selectors
    config.productLinkSelector = ".product_box .pb-name a, .product_box_name a, .pb-name a";
    config.priceSelector = ".pb-price";
    config.paginationSelector = "ul.pagination li a:contains('»'), .pagination li a.next";

    await prisma.supplier.update({
        where: { id: existing.id },
        data: { crawlerConfig: config }
    });
    console.log("Config updated with useProxy=true");
  } 
}

main().catch(console.error).finally(() => prisma.$disconnect());
