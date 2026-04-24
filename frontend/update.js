const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const act = await prisma.job.updateMany({
        where: { clientName: 'Sistem DEMO ClimaticPRO' },
        data: { status: 'pending' }
    });
    console.log("Updated", act.count);
}
main().finally(() => prisma.$disconnect());
