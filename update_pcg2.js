const { PrismaClient } = require('./frontend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.supplier.findFirst({ where: { name: "PC Garage" } });
  if (existing) {
    const config = existing.crawlerConfig;
    config.paginationSelector = "ul.pagination li a.next, a.next";
    config.productLinkSelector = ".product_box_name a, .pb-name a"; // Simplify to standard selectors

    await prisma.supplier.update({
        where: { id: existing.id },
        data: { crawlerConfig: config }
    });
    console.log("Config updated.");
  } 
}

main().catch(console.error).finally(() => prisma.$disconnect());
