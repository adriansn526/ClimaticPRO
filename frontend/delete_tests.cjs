const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const deleted = await prisma.job.deleteMany({
        where: {
            id: { in: [5, 144, 145, 146] }
        }
    });
    console.log("Deleted jobs count:", deleted.count);
}
run();
