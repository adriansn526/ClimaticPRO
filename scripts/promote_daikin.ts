import { getPrisma } from '../frontend/lib/prisma';
const prisma = getPrisma();

async function main() {
    const supplierId = 15; // Daikin-AVI-COMPACT
    
    const unmappedProducts = await prisma.unmappedSupplierProduct.findMany({
        where: { supplierId: supplierId }
    });
    
    console.log(`Found ${unmappedProducts.length} unmapped Daikin products.`);
    
    let createdCount = 0;
    
    for (const item of unmappedProducts) {
        let baseSlug = item.extractedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Ensure slug is unique
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.b2BProduct.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        try {
            // 1. Create the base B2BProduct
            const newProduct = await prisma.b2BProduct.create({
                data: {
                    name: item.extractedName,
                    slug: slug,
                    description: `Sistem Aer Conditionat Daikin - Import oficial B2B AVI COMPACT`,
                    priceB2B: item.extractedPrice,
                    priceRetail: item.extractedPrice,
                    stock: item.extractedStock === "in_stock" ? 10 : 0,
                    unit: 'sistem',
                    active: true,
                    manageStock: true,
                    isPriceOverridden: false,
                    syncToWooCommerce: false
                }
            });
            
            // 2. Link the Supplier
            await prisma.productSupplier.create({
                data: {
                    productId: newProduct.id,
                    supplierId: supplierId,
                    supplierProductUrl: item.supplierProductUrl,
                    supplierPrice: item.extractedPrice,
                    supplierStock: item.extractedStock
                }
            });
            
            // 3. Delete from Unmapped since it's now officially mapped as internal product
            await prisma.unmappedSupplierProduct.delete({
                where: { id: item.id }
            });
            
            createdCount++;
        } catch (e) {
            console.error(`Failed to promote ${item.extractedName}`, e);
        }
    }
    
    console.log(`Successfully promoted ${createdCount} Daikin products to internal DB.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
