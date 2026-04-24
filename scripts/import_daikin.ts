import * as fs from 'fs';
import { execSync } from 'child_process';
import { getPrisma } from '../frontend/lib/prisma';

const prisma = getPrisma();

async function main() {
    const pdfPath = '/home/asns/ClimaticPRO/docs/Furnizori/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf';
    console.log(`Parsing PDF: ${pdfPath}`);
    
    // Extract text using pdftotext
    const text = execSync(`pdftotext -layout "${pdfPath}" -`).toString();
    const lines = text.split('\n');

    let currentSystemName = '';
    let currentSystemPrice = 0;
    
    const results = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Match a product line (starts with capital letters/numbers, followed by prices)
        const productMatch = line.match(/^(.+?)\s{2,}([\d,.]+)/);
        
        if (productMatch && productMatch[1].trim() && isNaN(Number(productMatch[1].trim()))) {
            const name = productMatch[1].trim().replace(/\s+/g, ' ');
            
            // Collect all price-like tokens on this line
            const prices = line.match(/[\d]{1,3}(?:[,.][\d]{3})*(?:[,.][\d]{2})/g) || [];
            
            let systemPrice = 0;
            
            if (prices.length >= 4) {
               // 4 prices inline: [indoor_no_vat, system_no_vat, indoor_vat, system_vat]
               // Sometimes order is [ind_nov, sys_nov, ind_vat, sys_vat]
               const p = prices.map(priceStr => parseFloat(priceStr.replace(/,/g, '')));
               systemPrice = Math.max(...p); // System price is always the largest number
               currentSystemName = name;
            } else if (prices.length >= 2) {
               // 2 prices inline: [indoor_no_vat, indoor_vat]
               // Check the NEXT line for system prices (which are indented)
               if (i + 1 < lines.length) {
                   const nextLine = lines[i+1];
                   const nextPricesMatch = nextLine.match(/^\s+([\d.,]+)\s+([\d.,]+)$/);
                   if (nextPricesMatch) {
                       const sysPrices = nextLine.match(/[\d]{1,3}(?:[,.][\d]{3})*(?:[,.][\d]{2})/g);
                       if (sysPrices && sysPrices.length >= 2) {
                           const p1 = parseFloat(sysPrices[0].replace(/,/g, ''));
                           const p2 = parseFloat(sysPrices[1].replace(/,/g, ''));
                           systemPrice = Math.max(p1, p2);
                       }
                   }
               }
               currentSystemName = name;
            }
            
            if (systemPrice > 0) {
               results.push({
                   name: `Sistem Aer Conditionat Daikin ${currentSystemName}`,
                   price: systemPrice,
                   url: `daikin-${currentSystemName.replace(/\s+/g, '-').toLowerCase()}`,
                   stock: 'in_stock'
               });
            }
        }
    }

    console.log(`Extracted ${results.length} systems from PDF.`);
    if (results.length > 0) {
        console.log("Sample:", results[0]);
    }

    const supplierId = 15; // Daikin-AVI-COMPACT

    let added = 0;
    for (const item of results) {
        await prisma.unmappedSupplierProduct.upsert({
             where: { supplierProductUrl: item.url },
             update: {
                 extractedName: item.name,
                 extractedPrice: item.price,
                 extractedStock: item.stock,
                 lastScrapedAt: new Date(),
                 supplierId: supplierId
             },
             create: {
                 supplierId: supplierId,
                 supplierProductUrl: item.url,
                 extractedName: item.name,
                 extractedPrice: item.price,
                 extractedStock: item.stock
             }
        });
        added++;
    }
    
    console.log(`Successfully upserted ${added} records to UnmappedSupplierProduct.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
