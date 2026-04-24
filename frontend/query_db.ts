import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const jobs = await prisma.job.findMany({
        where: {
            clientName: { contains: 'Avram', mode: 'insensitive' }
        }
    });
    console.log("Found jobs:", JSON.stringify(jobs, null, 2));
}
run();
