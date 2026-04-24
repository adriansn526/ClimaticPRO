const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.productSupplier.findMany({
      where: { supplierProductUrl: { contains: 'msagbu-12hrfn8-qrd1gw-mox133-12hfn8-qrd1gw' } },
      include: { supplier: true }
  });
  console.log(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
