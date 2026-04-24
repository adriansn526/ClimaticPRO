const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const installers = await prisma.user.findMany({where: {role: 'installer'}, take: 1, select: {companyName: true, name: true, email: true}});
    console.log(installers);
    process.exit(0);
}
run();
