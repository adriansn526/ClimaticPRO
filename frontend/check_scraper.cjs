const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const jobs = await prisma.scraperJob.findMany({
        where: { supplierId: 4 }, // Eurocool ID is 4 based on earlier output
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log(JSON.stringify(jobs, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
