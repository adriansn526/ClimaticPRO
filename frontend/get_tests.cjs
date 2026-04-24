const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const jobs = await prisma.job.findMany({
        where: {
            OR: [
                { clientName: { contains: 'test' } },
                { clientName: { contains: 'Test' } },
                { address: { contains: 'test' } }
            ]
        }
    });
    console.log("Teste posibile:", jobs.length);
    console.log(jobs.map(j => `#${j.id} - ${j.clientName} - ${j.metadata?.wooOrderId || 'fără id woo'}`));
    
    // De asemenea hai sa vedem primele 10 job-uri din baza
    const all = await prisma.job.findMany({take: 10, orderBy: {id: 'asc'}});
    console.log("\nPrimele 10 joburi din baza de date:");
    console.log(all.map(j => `#${j.id} - ${j.clientName}`));
}
run();
