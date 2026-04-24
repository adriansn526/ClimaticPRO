const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.b2BProduct.findFirst({ where: { name: { contains: "Midea Breezeless, 48000" } }, include: { suppliers: { include: { supplier: true } } } });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
