// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log('Starting Woo Category Background Sync...');
    // We will just fetch ALL products directly from Prisma, then fetch their counter-part from WooCommerce using slug!
    
    const products = await prisma.b2BProduct.findMany({ where: { active: true } });
    console.log(`Found ${products.length} products to sync categories for.`);
    
    let updated = 0;
    
    for (const p of products) {
        try {
            const query = `
            query GetProduct {
                product(id: "${p.slug}", idType: SLUG) {
                    id
                    productCategories {
                        nodes {
                            databaseId
                        }
                    }
                }
            }`;
            
            const res = await fetch('https://cms.climaticpro.ro/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json() as any;
            
            if (data?.data?.product?.productCategories?.nodes) {
                const categoryIds = data.data.product.productCategories.nodes.map((n: any) => n.databaseId);
                if (categoryIds.length > 0) {
                     await prisma.b2BProduct.update({
                         where: { id: p.id },
                         data: { wooCategoryIds: categoryIds }
                     });
                     console.log(`Updated ${p.slug} with categories: ${categoryIds}`);
                     updated++;
                }
            }
        } catch (err) {
            console.log(`Failed to sync ${p.slug}: ${err}`);
        }
    }
    
    console.log(`Done! Synchronized ${updated} products categories.`);
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
      await prisma.$disconnect()
  })
