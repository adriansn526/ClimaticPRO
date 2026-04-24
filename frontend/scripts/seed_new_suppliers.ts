import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newSuppliers = [
  {
    name: 'MelindaInstal',
    websiteUrl: 'https://www.melindainstal.ro',
    active: true,
    crawlerConfig: {
      catalogUrls: [],
      productLinkSelector: '.product-item a',
      paginationSelector: 'a.next',
      priceSelector: '.price',
      titleSelector: 'h1',
      stockSelector: '.stock'
    }
  },
  {
    name: 'Frigotehnie',
    websiteUrl: 'https://www.frigotehnie.ro',
    active: true,
    crawlerConfig: {
      catalogUrls: [],
      productLinkSelector: '.product a',
      paginationSelector: 'a.next',
      priceSelector: '.price-amount',
      titleSelector: 'h1.product-title',
      stockSelector: '.stock.in-stock'
    }
  },
  {
    name: 'Aero Shop',
    websiteUrl: 'https://aero-shop.ro',
    active: true,
    crawlerConfig: {
      catalogUrls: [],
      productLinkSelector: '.product-loop a',
      paginationSelector: 'a.next',
      priceSelector: '.woocommerce-Price-amount',
      titleSelector: 'h1.product_title',
      stockSelector: '.stock'
    }
  },
  {
    name: 'Euro-Instal',
    websiteUrl: 'https://euro-instal.ro',
    active: true,
    crawlerConfig: {
      catalogUrls: [],
      productLinkSelector: '.product-box a',
      paginationSelector: '.pagination li a',
      priceSelector: '.price',
      titleSelector: 'h1',
      stockSelector: '.stock-status'
    }
  },
  {
    name: 'Ancopolar',
    websiteUrl: 'https://shop.ancopolar.ro',
    active: true,
    crawlerConfig: {
      catalogUrls: [],
      productLinkSelector: '.product a',
      paginationSelector: 'a.next',
      priceSelector: '.price',
      titleSelector: 'h1',
      stockSelector: '.stock'
    }
  },
  {
    name: 'Evofrost',
    websiteUrl: 'https://evofrost.ro',
    active: true,
    crawlerConfig: {
      catalogUrls: [],
      productLinkSelector: '.product a',
      paginationSelector: 'a.next',
      priceSelector: '.price',
      titleSelector: 'h1.title',
      stockSelector: '.stock'
    }
  }
];

async function main() {
  for (const supplier of newSuppliers) {
    const exists = await prisma.supplier.findFirst({
      where: { name: supplier.name }
    });

    if (!exists) {
      await prisma.supplier.create({
        data: supplier
      });
      console.log(`Added supplier: ${supplier.name}`);
    } else {
      console.log(`Supplier ${supplier.name} already exists.`);
    }
  }
  console.log('Seed completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
