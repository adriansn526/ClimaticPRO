import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';

const prisma = new PrismaClient();
const PDF_PATH = '/home/asns/ClimaticPRO/docs/Furnizori/Preturi de acchizitie Avans si Termen.pdf';
const SUPPLIER_NAME = 'ClimaStudio';

async function main() {
    console.log('[1] Running pdftotext -raw...');
    let text = '';
    try {
        text = execSync(`pdftotext -raw "${PDF_PATH}" -`, { encoding: 'utf-8' });
    } catch (err) {
        console.error('Failed to extract text from PDF', err);
        return;
    }

    // Isolate the AVANS section
    const avansSplit = text.split('Preturi de achizitie cu plata in AVANS:');
    if (avansSplit.length < 2) {
        console.error('Could not find AVANS section.');
        return;
    }
    const termenSplit = avansSplit[1].split('Preturi de achizitie cu plata la TERMEN:');
    const avansText = termenSplit[0];
    const termenText = termenSplit.length > 1 ? termenSplit[1] : '';

    console.log('[2] Parsing text blocks...');
    
    const products: { code: string; price: number; type: string }[] = [];
    
    function parseLines(blockText: string, typeName: string) {
        const lines = blockText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/[A-Z0-9]+-[A-Z0-9]+.*-I/i) || line.includes('/')) {
                let code = line;
                if (code.endsWith('/')) {
                    if (i + 1 < lines.length && !lines[i+1].includes('BTU')) {
                        code += lines[i+1];
                        i++;
                    }
                }
                
                let price = 0;
                for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                    if (lines[j].includes('Capacitate') || lines[j].includes('Cod')) continue;
                    const priceMatch = lines[j].trim().match(/^(\d{3,5}(\.\d+)?)/);
                    if (priceMatch) {
                         price = parseFloat(priceMatch[1]);
                         i = j;
                         break;
                    }
                }
                
                if (price > 0 && !code.includes('Capacitate') && !code.includes('Pret')) {
                    products.push({ code: code.replace(/\s/g, ''), price, type: typeName });
                }
            }
        }
    }

    parseLines(avansText, 'AVANS');
    if (termenText) {
        parseLines(termenText, 'TERMEN');
    }

    console.log(`[3] Found ${products.length} products in PDF:`);
    console.table(products);

    console.log('[4] Finding or creating Supplier ClimaStudio...');
    let supplier = await prisma.supplier.findFirst({ where: { name: SUPPLIER_NAME } });
    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: {
                name: SUPPLIER_NAME,
                active: true,
                autoSync: false
            }
        });
        console.log('Supplier created:', supplier.id);
    } else {
        console.log('Supplier found:', supplier.id);
    }

    console.log('[5] Matching with B2B Products (DRY RUN)...');
    
    // Attempt to match
    const b2bProducts = await prisma.b2BProduct.findMany({
        where: { name: { contains: 'Midea' } },
        select: { id: true, name: true, sku: true }
    });

    let matchedCount = 0;
    const unmatched = [];

    for (const p of products) {
        // Split internal/external code
        const parts = p.code.split('/');
        const searchTerms = parts.map(p => p.trim()).filter(p => p.length > 0);
        
        let matchedB2b = b2bProducts.find(b2b => {
             // If any part of the model matches the sku or name
             return searchTerms.some(term => {
                 if (term.length < 5) return false;
                 // Sometimes it ends with "-I" or "-O" while in DB it's without it
                 let cleanTerm = term.replace(/-I$/, '').replace(/-O$/, '').replace(/-CB$/, '');
                 if (b2b.sku && b2b.sku.includes(cleanTerm)) return true;
                 if (b2b.name && b2b.name.includes(cleanTerm)) return true;
                 return false;
             });
        });

        let modelName = 'Aparat AC Midea';
        if (p.code.includes('MGPXV')) modelName = 'Midea Solunar';
        else if (p.code.includes('CB1')) modelName = 'Midea Breezeless E';
        else if (p.code.includes('EZ')) modelName = 'Midea Solstice';

        if (matchedB2b) {
            console.log(`✅ MATCHED: ${p.code} (PDF) -> ${matchedB2b.name} (DB) | ${p.type}: ${p.price} RON`);
            
            // Insert into ProductSupplier
            // We can't insert multiple ProductSupplier for same supplier/product if it's unique.
            // Wait, ProductSupplier is unique per productId_supplierId! We can't have both AVANS and TERMEN mapped to the SAME product in the SAME supplier.
            // So we'll only automatically map the AVANS one to ProductSupplier!
            if (p.type === 'AVANS') {
                await prisma.productSupplier.upsert({
                    where: { productId_supplierId: { productId: matchedB2b.id, supplierId: supplier.id } },
                    update: { supplierPrice: p.price, supplierStock: 'in_stock', lastScrapedAt: new Date(), supplierProductCode: p.code },
                    create: { productId: matchedB2b.id, supplierId: supplier.id, supplierProductCode: p.code, supplierPrice: p.price, supplierStock: 'in_stock' }
                });
                matchedCount++;
            }
        } else {
            console.log(`❌ NOT MATCHED: ${modelName} ${p.code} (${p.type}) | ${p.price} RON`);
            
            const pdfUrl = `pdf://clima-studio/${p.code}/${p.type.toLowerCase()}`;
            await prisma.unmappedSupplierProduct.upsert({
                where: { supplierProductUrl: pdfUrl },
                update: { extractedName: `${modelName} ${p.code} (${p.type})`, extractedPrice: p.price, extractedStock: 'in_stock', lastScrapedAt: new Date() },
                create: { 
                     supplierId: supplier.id,
                     supplierProductUrl: pdfUrl,
                     extractedName: `${modelName} ${p.code} (${p.type})`,
                     extractedPrice: p.price,
                     extractedSku: `${p.code}-${p.type.substring(0,2)}`,
                     extractedStock: 'in_stock'
                }
            });
            unmatched.push(p);
        }
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total Extracted: ${products.length}`);
    console.log(`Matched: ${matchedCount}`);
    console.log(`Unmatched: ${unmatched.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
