const { PrismaClient } = require('./frontend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sups = await prisma.productSupplier.findMany({
    orderBy: { lastScrapedAt: 'desc' },
    take: 5,
    select: { supplier: { select: { name: true } }, lastScrapedAt: true, supplierPrice: true, product: { select: { slug: true } } }
  });
  console.log(JSON.stringify(sups, null, 2));

  console.log("\nRecent price history:");
  const hist = await prisma.supplierPriceHistory.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 5,
    select: { newPrice: true, oldPrice: true, recordedAt: true }
  });
  console.log(JSON.stringify(hist, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
