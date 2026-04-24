import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const supplierId = 1;

  const config = {
      catalogUrls: ['https://konnect-shop.ro/aer-conditionat'],
      productLinkSelector: '.name a',
      paginationSelector: 'a.next', // FIX: Specifically select exclusively the "Forward/Next" link!
      titleSelector: '.title.page-title, h1.title',
      priceSelector: '.price-normal, .price-new, .price',
      stockSelector: '.product-stats'
  };
  
  await prisma.supplier.update({
      where: { id: supplierId },
      data: { crawlerConfig: config }
  });
  console.log("Updated config for supplier ID: 1");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
