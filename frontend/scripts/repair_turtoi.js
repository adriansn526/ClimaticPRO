const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const job = await prisma.job.findFirst({
    where: { clientName: { contains: 'Turtoi' } }
  });
  if (job) {
    const meta = job.metadata || {};
    meta.rawAppointmentDate = '2026-04-06';
    await prisma.job.update({
        where: { id: job.id },
        data: { metadata: meta }
    });
    console.log("Repaired Turtoi job.");
  }
}

run().finally(() => prisma.$disconnect());
