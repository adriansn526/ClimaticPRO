import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { syncProductPricing } from '@/lib/repricer';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function POST(req: Request) {
  try {
    const { minScore = 90 } = await req.json();
    
    // Extragem param de filtrare pentru a mapa bulk exclusiv cand suntem in tabul vizat
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');
    
    const conditions: any = {
      status: 'pending',
      similarityScore: { gte: parseFloat(minScore) },
      suggestedProductId: { not: null }
    };
    
    if (supplierId) {
       conditions.supplierId = parseInt(supplierId, 10);
    }

    const pendingMatches = await prisma.unmappedSupplierProduct.findMany({
      where: conditions
    });

    if (pendingMatches.length === 0) {
      return NextResponse.json({ success: true, message: 'Nu sunt produse care să îndeplinească acest criteriu de similaritate.', count: 0 });
    }

    let mappedCount = 0;

    for (const unmapped of pendingMatches) {
        if (!unmapped.suggestedProductId) continue; // Safety check

        const existingLink = await prisma.productSupplier.findUnique({
          where: {
            productId_supplierId: {
              productId: unmapped.suggestedProductId,
              supplierId: unmapped.supplierId
            }
          }
        });

        if (existingLink) {
          if (existingLink.supplierPrice !== unmapped.extractedPrice) {
              await prisma.supplierPriceHistory.create({
                  data: {
                      productSupplierId: existingLink.id,
                      oldPrice: existingLink.supplierPrice,
                      newPrice: unmapped.extractedPrice
                  }
              });
          }
          await prisma.productSupplier.update({
            where: { id: existingLink.id },
            data: {
              supplierProductUrl: unmapped.supplierProductUrl,
              supplierPrice: unmapped.extractedPrice,
              supplierStock: unmapped.extractedStock,
              lastScrapedAt: new Date()
            }
          });
        } else {
          await prisma.productSupplier.create({
            data: {
              productId: unmapped.suggestedProductId,
              supplierId: unmapped.supplierId,
              supplierProductUrl: unmapped.supplierProductUrl,
              supplierPrice: unmapped.extractedPrice,
              supplierStock: unmapped.extractedStock
            }
          });
        }

        // GOLDEN PIM ENRICH
        const b2bProduct = await prisma.b2BProduct.findUnique({
             where: { id: unmapped.suggestedProductId }
        });
        
        if (b2bProduct && (!b2bProduct.image || !b2bProduct.description || b2bProduct.description.length < 50)) {
             if (unmapped.supplierProductUrl && !unmapped.supplierProductUrl.startsWith('pdf://') && !unmapped.supplierProductUrl.startsWith('md://')) {
                 const protocol = req.headers.get('x-forwarded-proto') || 'http';
                 const host = req.headers.get('host');
                 fetch(`${protocol}://${host}/api/admin/suppliers/quarantine/enrich`, { 
                     method: 'POST', 
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ 
                        productId: b2bProduct.id, 
                        url: unmapped.supplierProductUrl, 
                        supplierId: unmapped.supplierId 
                     }) 
                 }).catch(console.error);
             }
        }

        await prisma.unmappedSupplierProduct.update({
          where: { id: unmapped.id },
          data: { status: 'mapped' }
        });

        // Sincronizeaza pretul intern al produsului dupa noua mapare (Engine Reprice)
        await syncProductPricing(unmapped.suggestedProductId);

        mappedCount++;
    }

    return NextResponse.json({ success: true, message: `${mappedCount} produse au fost asociate în masă cu succes.`, count: mappedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
