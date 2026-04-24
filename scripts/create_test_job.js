const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const installerId = '+40731156333';
  
  const testJob = await prisma.job.create({
    data: {
      clientName: 'Client Test ClimaticPRO',
      clientPhone: '0700000000',
      address: 'Strada Testării nr. 1, București',
      status: 'in_progress',
      installerId: installerId,
      metadata: {
        email: 'test@climaticpro.ro', 
        products: [{ name: 'Aparat Aer Condiționat Test 12000 BTU' }]
      }
    }
  });

  console.log('Un job de test a fost creat cu succes! ID:', testJob.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
