const { PrismaClient } = require('./frontend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const name = "PC Garage";
  const url = "https://www.pcgarage.ro/aer-conditionat/";
  const config = {
    catalogUrls: [url],
    productLinkSelector: ".product_box_name a, .pb-name a",
    paginationSelector: "ul.pagination li a.next, a.next, .pagination-next",
    priceSelector: ".pb-price .price, .price, .product-new-price",
    titleSelector: "h1",
    stockSelector: ".pb-stock, .stock-status, .availability, p.stock"
  };

  const existing = await prisma.supplier.findFirst({ where: { name } });
  if (existing) {
    console.log("Already exists.");
    await prisma.supplier.update({
        where: { id: existing.id },
        data: { crawlerConfig: config }
    });
    console.log("Config updated.");
  } else {
    await prisma.supplier.create({
      data: {
        name,
        active: true,
        websiteUrl: "https://www.pcgarage.ro",
        crawlerConfig: config,
        supplierRole: "COMPETITOR",
        competitorUndercut: 0.50
      }
    });
    console.log("PC Garage added.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
