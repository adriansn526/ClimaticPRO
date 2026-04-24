// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { syncProductPricing } from '../lib/repricer';

const prisma = new PrismaClient();

const PRODUCTS_TO_MAP = [
    // Fujitsu Items
    {
         searchText: 'ASEH09KNCA',
         name: 'Aparat de aer conditionat Fujitsu ASEH09KNCA 9000 BTU, Inverter, Clasa A++',
         price: 2235,
         sku: 'ASEH09KNCA'
    },
    {
         searchText: 'ASEH12KNCA', 
         name: 'Aparat de aer conditionat Fujitsu ASEH12KNCA 12000 BTU, Inverter, Clasa A++',
         price: 2354,
         sku: 'ASEH12KNCA'
    },
    {
         searchText: 'ASEG18KLCA',
         name: 'Aparat de aer conditionat Fujitsu ASEG18KLCA 18000 BTU, Inverter, Clasa A++',
         price: 4220,
         sku: 'ASEG18KLCA'
    },
    {
         searchText: 'ASEG24KLCA',
         name: 'Aparat de aer conditionat Fujitsu ASEG24KLCA 24000 BTU, Inverter, Clasa A++',
         price: 5368,
         sku: 'ASEG24KLCA'
    },
    
    // Yamato Items
    {
         searchText: 'YW09T3B',
         name: 'Aparat de aer conditionat Yamato Avanti Black YW09T3B 9000 BTU, Inverter, Kit inclus',
         price: 1561,
         sku: 'YW09T3B'
    },
    {
         searchText: 'YW09T3n',
         name: 'Aparat de aer conditionat Yamato Avanti YW09T3N 9000 BTU, Inverter, Alb, Kit inclus',
         price: 1522,
         sku: 'YW09T3N'
    },

    // Gree Krya Items
    {
         searchText: 'GWH09AWAXB',
         name: 'Aparat de aer conditionat Gree Krya GWH09AWAXB-K6DNA2B 9000 BTU, Inverter, Kit inclus',
         price: 1676,
         sku: 'GWH09AWAXB-K6DNA2B'
    },
    {
         searchText: 'GWH24AWDXE',
         name: 'Aparat de aer conditionat Gree Krya GWH24AWDXE-K6DNA2A 24000 BTU, Inverter, Kit inclus',
         price: 4198,
         sku: 'GWH24AWDXE-K6DNA2A'
    }
];

async function run() {
    console.log("Starting PDF Price Importer...");

    // 1. Create or Find Supplier "Importator Oficial (Lista Iunie 2025)"
    let supplier = await prisma.supplier.findFirst({
         where: { name: "Importator Oficial (Lista Iunie 2025)" }
    });
    
    if (!supplier) {
         supplier = await prisma.supplier.create({
              data: {
                  name: "Importator Oficial (Lista Iunie 2025)",
                  contact: "Lista PDF",
                  active: true
              }
         });
         console.log(`Created Supplier: ${supplier.name} (ID: ${supplier.id})`);
    } else {
         console.log(`Found Supplier: ${supplier.name}`);
    }

    // 2. Loop through mapped products
    const processedProductIds = new Set<number>();

    for (const item of PRODUCTS_TO_MAP) {
         // Search if product exists in Hub Database
         const existingProductList = await prisma.b2BProduct.findMany({
              where: { name: { contains: item.searchText, mode: 'insensitive' } }
         });
         
         let b2bProductId = null;

         if (existingProductList.length > 0) {
              b2bProductId = existingProductList[0].id;
              console.log(`Found target for ${item.sku}: ${existingProductList[0].name}`);
         } else {
              // Create the missing B2BProduct!
              // For a newly created product, generate slug
              const newSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              
              const newProduct = await prisma.b2BProduct.create({
                   data: {
                       name: item.name,
                       sku: item.sku,
                       slug: newSlug,
                       description: `<p>${item.name}</p>`,
                       priceB2B: item.price,
                       priceRetail: item.price, 
                       stock: 10,
                       unit: 'buc',
                       active: true,
                       wooCategoryIds: []
                   }
              });
              b2bProductId = newProduct.id;
              console.log(`Created new missing product: ${item.name}`);
         }

         if (b2bProductId) {
              processedProductIds.add(b2bProductId);
              // Upsert the ProductSupplier relationship 
              // Price must use item.price
              const rel = await prisma.productSupplier.findUnique({
                   where: { productId_supplierId: { productId: b2bProductId, supplierId: supplier.id } }
              });

              if (rel) {
                   await prisma.productSupplier.update({
                       where: { id: rel.id },
                       data: { supplierPrice: item.price, supplierStock: "in_stock", lastScrapedAt: new Date() }
                   });
                   console.log(`Updated supplier Price [${item.price}] for ${item.sku}`);
              } else {
                   await prisma.productSupplier.create({
                       data: {
                           productId: b2bProductId,
                           supplierId: supplier.id,
                           supplierPrice: item.price,
                           supplierStock: "in_stock",
                           supplierProductCode: item.sku
                       }
                   });
                   console.log(`Created supplier link [${item.price}] for ${item.sku}`);
              }
         }
    }

    // 3. Recalculate margins via Repricer
    console.log("Triggering Automatic Repricer...");
    for (const id of Array.from(processedProductIds)) {
         await syncProductPricing(id);
         console.log(`Repricer updated product ID: ${id}`);
    }

    console.log("Job completed successfully!");
}

run()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
