const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const deleted = await prisma.job.deleteMany({
        where: {
            id: { in: [3, 4] }
        }
    });
    console.log("Deleted jobs count:", deleted.count);
    await prisma.$disconnect();
    process.exit(0);
}
run();
