const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseMdFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const products = [];
    
    let currentCategory = '';
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Match category headers like "1) Midea Xtreme Fresh" or "3) Casete Midea Breezeless:"
        const catMatch = trimmed.match(/^\d+\)\s*(.+)/);
        if (catMatch) {
            currentCategory = catMatch[1].replace(':', '').trim();
            continue;
        }
        
        // Match product lines like "- 12000 BTU MCA4U-12HRFNX(GA)/ T-MBQ4-03AWD = 3595 LEI cu TVA/buc"
        // or "- UI 9000 BTU AG2DURA-09NXD0-I(R) v1 = 491 LEI cu TVA/buc"
        // or "- UE 18000 BTU M2OE-18HFN8-Q = 3062 LEI cu TVA/buc"
        const prodMatch = trimmed.match(/^-\s+(UE\s+|UI\s+)?(\d+)\s+BTU\s+(.+?)\s*=\s*(\d+(\.\d+)?)\s*LE[Ii]/i);
        
        if (prodMatch) {
            const isUE = prodMatch[1] && prodMatch[1].trim().toUpperCase() === 'UE';
            const isUI = prodMatch[1] && prodMatch[1].trim().toUpperCase() === 'UI';
            const btu = prodMatch[2];
            const code = prodMatch[3];
            const price = parseFloat(prodMatch[4]);
            
            // Generate a searchable name context
            let searchContext = currentCategory;
            if (currentCategory.toLowerCase().includes('multi-split')) {
                 if (isUE) searchContext = 'Externa';
                 if (isUI) searchContext = 'Interna';
            }

            products.push({
                category: currentCategory,
                searchContext,
                btu,
                sku: code,
                price
            });
        }
    }
    return products;
}

async function main() {
    console.log("Parsing ClimaStudio.md...");
    const mdProducts = parseMdFile('/home/asns/ClimaticPRO/docs/Furnizori/ClimaStudio.md');
    
    console.log(`Found ${mdProducts.length} products in MD file.`);
    
    const dbProductsRaw = await prisma.b2BProduct.findMany({
        where: { name: { contains: "Midea", mode: 'insensitive' } }
    });
    
    console.log(`Found ${dbProductsRaw.length} Midea products in DB.\n`);
    
    let matchCount = 0;
    
    for (const mdP of mdProducts) {
        // Try to match DB product
        let bestMatch = null;
        
        for (const dbP of dbProductsRaw) {
            const dbName = dbP.name.toLowerCase();
            
            // Criteria: Must match BTU
            if (dbName.includes(mdP.btu)) {
                // Must match category/keyword
                let categoryMatch = false;
                
                if (mdP.category.toLowerCase().includes("breezeless") && dbName.includes("breezeless")) {
                    categoryMatch = true;
                } else if (mdP.category.toLowerCase().includes("xtreme fresh") && dbName.includes("xtreme fresh")) {
                    categoryMatch = true;
                } else if (mdP.category.toLowerCase().includes("all easy pro") && dbName.includes("all easy")) {
                    categoryMatch = true;
                } else if (mdP.category.toLowerCase().includes("duct") && dbName.includes("duct")) {
                    categoryMatch = true;
                } else if (mdP.category.toLowerCase().includes("coloane") && dbName.includes("coloan")) {
                    categoryMatch = true;
                } else if (mdP.category.toLowerCase().includes("convertibil") && dbName.includes("tavan")) {
                    categoryMatch = true;
                } else if (mdP.category.toLowerCase().includes("multi-split")) {
                    if (mdP.searchContext === 'Externa' && dbName.includes('extern')) {
                        categoryMatch = true;
                    } else if (mdP.searchContext === 'Interna' && (dbName.includes('intern') || !dbName.includes('extern'))) {
                        // Sometimes UI doesn't explicitly say "intern"
                        categoryMatch = true;
                    }
                    // Generic multi-split failover
                    if (dbName.includes('multi-split')) categoryMatch = true;
                }
                
                if (categoryMatch) {
                    bestMatch = dbP;
                    break;
                }
            }
        }
        
        if (bestMatch) {
            console.log(`✅ MATCHED: [${mdP.btu} BTU, ${mdP.category}] -> "${bestMatch.name}"`);
            console.log(`   INJECTING SKU: ${mdP.sku}`);
            
            await prisma.b2BProduct.update({
                where: { id: bestMatch.id },
                data: { sku: mdP.sku }
            });
            matchCount++;
            
            // Also update WooCommerce product's SKU via WooCommerce sync logic if applicable,
            // but for now just updating the DB is enough. The user can resync via the interface.
        } else {
            console.log(`❌ NOT FOUND IN DB: [${mdP.btu} BTU, ${mdP.category}] (Price: ${mdP.price})`);
        }
    }
    
    console.log(`\nOperation Complete. Successfully injected SKUs into ${matchCount} products.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
