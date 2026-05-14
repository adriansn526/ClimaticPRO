const { PrismaClient } = require('./frontend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.b2BProduct.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: { slug: true, updatedAt: true, repricerMeta: true }
  });
  console.log(JSON.stringify(products, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
