import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const euroclass = await prisma.supplier.findFirst({ where: { name: { contains: 'Euroclass' } } });
  console.dir(euroclass?.crawlerConfig, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
