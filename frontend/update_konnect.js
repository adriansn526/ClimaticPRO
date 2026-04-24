const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const konnect = await prisma.supplier.findFirst({ where: { name: { contains: 'KONNECT' } } });
  
  if(konnect) {
      let config = konnect.crawlerConfig;
      // Prepend #content classes to force matching the main product first
      config.priceSelector = '#content .product-price-new, #content .product-price, #content .price-new, #content .price, .product-price-new, .product-price, .price-new, .price';
      
      await prisma.supplier.update({
          where: { id: konnect.id },
          data: { crawlerConfig: config }
      });
      console.log("Config updated:", config);
  } else {
      console.log("Konnect not found");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
