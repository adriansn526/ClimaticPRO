const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.job.findMany({
    where: { clientName: { contains: 'Turtoi' } }
  });
  console.log(JSON.stringify(jobs, null, 2));
}

run().finally(() => prisma.$disconnect());
