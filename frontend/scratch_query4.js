const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ps = await prisma.productSupplier.findFirst({
      where: { 
          supplierId: 1, // Konnect
          product: { name: { contains: 'MSAGAU' } }
      },
      include: { product: true }
  });
  console.log(ps.supplierProductUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
