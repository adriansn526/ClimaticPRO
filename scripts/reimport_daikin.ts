import { getPrisma } from '../frontend/lib/prisma';
import { execSync } from 'child_process';

const prisma = getPrisma();

async function main() {
    const pdfPath = '/home/asns/ClimaticPRO/docs/Furnizori/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf';
    console.log(`Parsing PDF: ${pdfPath}`);
    
    const text = execSync(`pdftotext -layout "${pdfPath}" -`).toString();
    const lines = text.split('\n');

    let currentModel = '';
    const results = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Detect Model Category from headers
        const upperLine = line.toUpperCase();
        if (upperLine.includes('SENSIRA')) currentModel = 'Sensira';
        else if (upperLine.includes('SIESTA')) currentModel = 'Siesta';
        else if (upperLine.includes('COMFORA')) currentModel = 'Comfora';
        else if (upperLine.includes('PERFERA')) currentModel = 'Perfera';
        else if (upperLine.includes('STYLISH')) currentModel = 'Stylish';
        else if (upperLine.includes('EMURA') && !upperLine.includes('NEPURA EMURA')) currentModel = 'Emura';
        else if (upperLine.includes('URURU SARARA')) currentModel = 'Ururu Sarara';
        else if (upperLine.includes('NEPURA PERFERA')) currentModel = 'Nepura Perfera';
        else if (upperLine.includes('NEPURA STYLISH')) currentModel = 'Nepura Stylish';
        else if (upperLine.includes('NEPURA EMURA')) currentModel = 'Nepura Emura';
        
        // Match a product line (spacing-based regex)
        const productMatch = line.match(/^([A-Za-z0-9\- \(\)]+?)\s{2,}([\d,.]+)/);
        
        if (productMatch && productMatch[1].trim() && isNaN(Number(productMatch[1].trim()))) {
            let extractedName = productMatch[1].trim().replace(/\s+/g, ' ');

            // Ignore adapter/filters
            if (extractedName.toLowerCase().includes('adaptor') || extractedName.toLowerCase().includes('filtru') || extractedName.toLowerCase().includes('mck')) continue;

            const prices = line.match(/[\d]{1,3}(?:[,.][\d]{3})*(?:[,.][\d]{2})/g) || [];
            let systemPrice = 0;
            
            if (prices.length >= 4) {
               const p = prices.map(priceStr => parseFloat(priceStr.replace(/,/g, '')));
               systemPrice = Math.max(...p); 
            } else if (prices.length >= 2) {
               if (i + 1 < lines.length) {
                   const nextLine = lines[i+1];
                   if (nextLine.match(/^\s+([\d.,]+)\s+([\d.,]+)$/)) {
                       const sysPrices = nextLine.match(/[\d]{1,3}(?:[,.][\d]{3})*(?:[,.][\d]{2})/g);
                       if (sysPrices && sysPrices.length >= 2) {
                           systemPrice = Math.max(parseFloat(sysPrices[0].replace(/,/g, '')), parseFloat(sysPrices[1].replace(/,/g, '')));
                       }
                   }
               }
            }
            
            if (systemPrice > 0) {
               // E.g. extractedName = "FTXC 20 E" -> coreCode = "FTXC20E"
               // Some names have " - alb", we want to remove the part after dash for core code match
               let coreBase = extractedName.split('-')[0].trim();
               let coreCode = coreBase.replace(/\s+/g, '');
               
               results.push({
                   rawName: extractedName,
                   fullName: `Sistem Aer Conditionat Daikin ${currentModel} ${extractedName}`.trim(),
                   coreCode: coreCode,
                   price: systemPrice,
                   url: `daikin-${extractedName.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}`,
                   stock: 'in_stock'
               });
            }
        }
    }

    // Process all Daikin items in DB
    const existingProducts = await prisma.b2BProduct.findMany({
        where: { name: { contains: 'daikin', mode: 'insensitive' } }
    });

    const supplierId = 15;
    let mappedCount = 0;
    let createdCount = 0;

    for (const item of results) {
        // Try to find a match
        const match = existingProducts.find(prod => {
            const normalizedDbName = prod.name.toUpperCase().replace(/\s+/g, '');
            return normalizedDbName.includes(item.coreCode.toUpperCase());
        });

        if (match) {
            // Found existing! Update it with new price and link supplier.
            await prisma.b2BProduct.update({
                where: { id: match.id },
                data: {
                    priceB2B: item.price,
                    priceRetail: item.price
                }
            });
            await prisma.productSupplier.create({
                data: {
                    productId: match.id,
                    supplierId: supplierId,
                    supplierProductUrl: item.url,
                    supplierPrice: item.price,
                    supplierStock: item.stock
                }
            });
            mappedCount++;
            console.log(`[🔗 MAPPED] ${item.coreCode} -> Existing [${match.name}]`);
        } else {
            // Not found, create new B2B Product
            let slug = item.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let uSlug = slug;
            let counter = 1;
            while (await prisma.b2BProduct.findUnique({ where: { slug: uSlug } })) {
                uSlug = `${slug}-${counter++}`;
            }

            const newProduct = await prisma.b2BProduct.create({
                data: {
                    name: item.fullName,
                    slug: uSlug,
                    description: `Sistem Aer Conditionat Daikin oficial import.`,
                    priceB2B: item.price,
                    priceRetail: item.price,
                    stock: 10,
                    unit: 'sistem',
                    active: true,
                    manageStock: true,
                    isPriceOverridden: false,
                    syncToWooCommerce: false
                }
            });

            await prisma.productSupplier.create({
                data: {
                    productId: newProduct.id,
                    supplierId: supplierId,
                    supplierProductUrl: item.url,
                    supplierPrice: item.price,
                    supplierStock: item.stock
                }
            });
            createdCount++;
            console.log(`[✨ CREATED] ${item.fullName}`);
        }
    }

    console.log(`\n========= RESULTS =========`);
    console.log(`Total Extracted PDF Systems: ${results.length}`);
    console.log(`Mapped/Updated on existing: ${mappedCount}`);
    console.log(`Created as NEW B2BProducts: ${createdCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
