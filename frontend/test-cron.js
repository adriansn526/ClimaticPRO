const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sups = await prisma.supplierLink.findMany({
    orderBy: { lastScrapedAt: 'desc' },
    take: 5,
    select: { supplier: { select: { name: true } }, lastScrapedAt: true, supplierPrice: true }
  });
  console.log(JSON.stringify(sups, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
