const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WP_GRAPHQL_URL = 'https://cms.climaticpro.ro/graphql';

async function fetchGraphQL(query: string, variables = {}) {
    const res = await fetch(WP_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) {
        console.error(json.errors);
        throw new Error('Failed to fetch API');
    }
    return json.data;
}

async function importB2BProducts() {
    console.log('🔄 Starting WooCommerce B2B Product Import via GraphQL...');
    try {
        console.log(`Fetching categories from ${WP_GRAPHQL_URL}...`);
        const catData = await fetchGraphQL(`
            query GetCategories {
                productCategories(first: 100) {
                    nodes {
                        databaseId
                        name
                        slug
                        description
                    }
                }
            }
        `);

        const wcCategories = catData.productCategories.nodes;
        console.log(`Found ${wcCategories.length} categories. Syncing...`);

        const categoryMap = new Map();
        for (const wcCat of wcCategories) {
            const cat = await prisma.b2BCategory.upsert({
                where: { slug: wcCat.slug || '' },
                update: { name: wcCat.name, description: wcCat.description || '' },
                create: { name: wcCat.name, slug: wcCat.slug || '', description: wcCat.description || '' }
            });
            categoryMap.set(wcCat.databaseId, cat.id);
        }

        console.log(`Fetching products from ${WP_GRAPHQL_URL}...`);
        const prodData = await fetchGraphQL(`
            query GetProducts {
                products(first: 100, where: {status: "publish"}) {
                    nodes {
                        databaseId
                        name
                        slug
                        sku
                        description
                        shortDescription
                        image { sourceUrl }
                        ... on SimpleProduct {
                            price
                            regularPrice
                            stockQuantity
                            productCategories { nodes { databaseId } }
                        }
                    }
                }
            }
        `);

        const wcProducts = prodData.products.nodes;
        console.log(`Found ${wcProducts.length} active products. Syncing to Postgre...`);

        let imported = 0;
        for (const wcProd of wcProducts) {
            let b2bPrice = 0;
            const parseWcPrice = (priceStr: string) => {
                if (!priceStr) return 0;
                // Keep only digits, commas, and dots. Then remove commas (thousands separators)
                const cleanStr = priceStr.replace(/[^0-9,.]+/g, '').replace(/,/g, '');
                return parseFloat(cleanStr);
            };

            let retailPrice = parseWcPrice(wcProd.regularPrice || wcProd.price);

            // Maintain exact WooCommerce price
            b2bPrice = retailPrice;

            // Category
            let prismaCatId = null;
            if (wcProd.productCategories?.nodes?.length > 0) {
                const mainCatId = wcProd.productCategories.nodes[0].databaseId;
                prismaCatId = categoryMap.get(mainCatId) || null;
            }

            // Capacity (Skip for this quick initial import, Admin will set it)
            let capacityValue = '';

            // Image URL
            const imageUrl = wcProd.image?.sourceUrl || null;

            await prisma.b2BProduct.upsert({
                where: { slug: wcProd.slug },
                update: {
                    name: wcProd.name,
                    sku: wcProd.sku || null,
                    description: wcProd.shortDescription || wcProd.description,
                    capacity: capacityValue,
                    priceB2B: b2bPrice,
                    priceRetail: retailPrice,
                    image: imageUrl,
                    categoryId: prismaCatId,
                    stock: wcProd.stockQuantity || 10,
                },
                create: {
                    name: wcProd.name,
                    slug: wcProd.slug,
                    sku: wcProd.sku || null,
                    description: wcProd.shortDescription || wcProd.description,
                    capacity: capacityValue,
                    priceB2B: b2bPrice,
                    priceRetail: retailPrice,
                    image: imageUrl,
                    categoryId: prismaCatId,
                    stock: wcProd.stockQuantity || 10,
                }
            });
            imported++;
        }

        console.log(`✅ Successfully imported/updated ${imported} B2B products from WooCommerce!`);

    } catch (error) {
        console.error('❌ Error importing products:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importB2BProducts();
