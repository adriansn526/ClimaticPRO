import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const MD_PATH = '/home/asns/ClimaticPRO/docs/Furnizori/ClimaStudio.md';
const SUPPLIER_NAME = 'ClimaStudio';

async function main() {
    console.log('[1] Reading MD file...');
    if (!fs.existsSync(MD_PATH)) {
        console.error('MD file not found:', MD_PATH);
        return;
    }
    
    const text = fs.readFileSync(MD_PATH, 'utf-8');
    const lines = text.split('\n');

    const products: { category: string; code: string; btu: string; price: number }[] = [];
    
    let currentCategory = 'Unknown';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;

        // Match category like "1) Midea Xtreme Fresh" or "4) Duct-uri"
        const categoryMatch = trimmed.match(/^\d+\)\s*(.+)$/);
        if (categoryMatch) {
            currentCategory = categoryMatch[1].replace(':', '').trim();
            continue; // Go to next line
        }

        // Match lines like "- 9000 BTU MSAGAU-09HRFN8... = 1498 LEI cu TVA/buc"
        // Also match "- UE 18000 BTU M2OE-18HFN8-Q = 3062 LEI cu TVA/buc" 
        // Also match "- Modul WIFI SK-103 MIDEA WIFI MODULE = 45 LEI cu TVA/buc."
        const productMatch = trimmed.match(/-\s*(.*?)\s*=\s*(\d+)\s*LEI/i);
        
        if (productMatch) {
            let details = productMatch[1]; // e.g., "9000 BTU MSAGAU-09HR..." or "UE 18000 BTU M... "
            const price = parseInt(productMatch[2], 10);
            
            // Extract BTU if present
            let btu = '';
            const btuMatch = details.match(/(\d+)\s*BTU/i);
            if (btuMatch) {
                btu = btuMatch[1] + ' BTU';
                details = details.replace(btuMatch[0], '').trim();
            }
            
            // Clean common prefixes from details
            details = details.replace(/^UE\s*/i, '').replace(/^UI\s*/i, '').trim();

            // Map categories to cleaner Midea titles
            let cleanCategory = currentCategory;
            if (cleanCategory === 'Coloane') cleanCategory = 'AC Coloana Midea';
            else if (cleanCategory === 'Convertibil (Podea/Tavan)') cleanCategory = 'AC Convertibil Midea';
            else if (cleanCategory === 'Duct-uri') cleanCategory = 'Duct Midea';
            else if (cleanCategory === 'Casete Midea Breezeless') cleanCategory = 'AC Caseta Midea Breezeless';
            else if (cleanCategory === 'Multi-Split') cleanCategory = 'AC Multi-Split Midea (UE)';

            products.push({
                category: cleanCategory,
                code: details,
                btu: btu,
                price: price
            });
        } else if (trimmed === 'Interioare') {
            currentCategory = 'AC Multi-Split Midea (UI)';
        }
    }

    console.log(`[2] Found ${products.length} products in MD:`);
    console.table(products);

    console.log('[3] Finding or creating Supplier ClimaStudio...');
    let supplier = await prisma.supplier.findFirst({ where: { name: SUPPLIER_NAME } });
    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: { name: SUPPLIER_NAME, active: true, autoSync: false }
        });
    }

    console.log('[4] Match/Insert into UnmappedSupplierProduct ...');

    let inserted = 0;
    for (const p of products) {
        // Build the extracted name string
        let extractedName = p.category;
        if (p.btu) extractedName += ` ${p.btu}`;
        extractedName += ` (${p.code})`;

        // Since these prices include VAT (TVA), let's strip TVA for the API, usually B2B works without TVA, 
        // wait! The user said: "Preturile de achizitie cu plata in AVANS:" and earlier "RON cu TVA si TV"!
        // Did the PDF prices include TVA? "Pret de Achizitie (RON cu TVA si TV)".
        // Yes, the PDF prices also included TVA and TV. The user B2B stores cost prices. We just import them exactly as is, if that's what we did for the PDF.
        // Let's keep the price as is.

        const pdfUrl = `md://clima-studio/${p.category.replace(/\s+/g,'-').toLowerCase()}/${p.code.replace(/\//g,'_')}`;
        
        await prisma.unmappedSupplierProduct.upsert({
            where: { supplierProductUrl: pdfUrl },
            update: { 
                extractedName: extractedName, 
                extractedPrice: p.price, 
                extractedStock: 'in_stock', 
                lastScrapedAt: new Date() 
            },
            create: { 
                 supplierId: supplier.id,
                 supplierProductUrl: pdfUrl,
                 extractedName: extractedName,
                 extractedPrice: p.price,
                 extractedSku: p.code.split('/')[0], // Use first part of the code as SKU
                 extractedStock: 'in_stock'
            }
        });
        inserted++;
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total Extracted: ${products.length}`);
    console.log(`Saved as Unmapped: ${inserted}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
