import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  const cutoff = new Date(Date.now() - 300 * 60 * 1000); // 5 hours ago
  
  const result = await prisma.job.deleteMany({
    where: {
      createdAt: {
        gte: cutoff
      }
    }
  });
  
  console.log(`Successfully deleted ${result.count} incorrectly assigned jobs from the last 120 minutes.`);
}

clean()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
