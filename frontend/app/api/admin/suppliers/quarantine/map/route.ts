import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { syncProductPricing } from '@/lib/repricer';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function POST(req: Request) {
  try {
    const { unmappedId, productId } = await req.json();

    if (!unmappedId || !productId) {
      return NextResponse.json({ success: false, message: 'ID-uri lipsă.' }, { status: 400 });
    }

    const unmapped = await prisma.unmappedSupplierProduct.findUnique({
      where: { id: parseInt(unmappedId) }
    });

    if (!unmapped) {
      return NextResponse.json({ success: false, message: 'Produsul nu a fost găsit în carantină.' }, { status: 404 });
    }

    // Crează sau actualizează legătura cu B2BProduct
    const existingLink = await prisma.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId: parseInt(productId),
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
          productId: parseInt(productId),
          supplierId: unmapped.supplierId,
          supplierProductUrl: unmapped.supplierProductUrl,
          supplierPrice: unmapped.extractedPrice,
          supplierStock: unmapped.extractedStock
        }
      });
    }

    // GOLDEN PIM ENRICH: Check if product needs enrichment
    const b2bProduct = await prisma.b2BProduct.findUnique({
         where: { id: parseInt(productId) }
    });
    
    if (b2bProduct && (!b2bProduct.image || !b2bProduct.description || b2bProduct.description.length < 50)) {
         if (unmapped.supplierProductUrl && !unmapped.supplierProductUrl.startsWith('pdf://') && !unmapped.supplierProductUrl.startsWith('md://')) {
             console.log("[Golden PIM] Triggering background enrichment for:", b2bProduct.name);
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
             }).catch(console.error); // fire and forget
         }
    }

    // Marchează ca asociat (mapped)
    await prisma.unmappedSupplierProduct.update({
      where: { id: unmapped.id },
      data: { status: 'mapped' }
    });

    // Sincronizare automată a prețului după o nouă potrivire!
    await syncProductPricing(parseInt(productId));

    return NextResponse.json({ success: true, message: 'Asocierea a fost salvată cu succes.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
