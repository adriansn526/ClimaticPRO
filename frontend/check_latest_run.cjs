const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const jobs = await prisma.scraperJob.findMany({
        where: { supplierId: 4 }, // Eurocool
        orderBy: { createdAt: 'desc' },
        take: 1
    });
    console.log(JSON.stringify(jobs[0], null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
