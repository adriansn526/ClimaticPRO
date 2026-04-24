import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const konnect = await prisma.supplier.findFirst({ where: { name: { contains: 'KONNECT' } } });
  console.dir(konnect?.crawlerConfig, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
