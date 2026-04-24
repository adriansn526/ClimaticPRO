import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function GET() {
  try {
    const unmappedProducts = await prisma.unmappedSupplierProduct.findMany({
      where: { status: 'pending' },
      include: {
        supplier: {
          select: { id: true, name: true }
        },
        suggestedProduct: {
          select: { 
            id: true, name: true, priceB2B: true, image: true, sku: true,
            suppliers: {
               include: { supplier: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { similarityScore: 'desc' }
    });

    return NextResponse.json({ success: true, data: unmappedProducts });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
