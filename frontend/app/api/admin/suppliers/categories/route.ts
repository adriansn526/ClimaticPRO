import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function GET() {
  try {
    const mappings = await prisma.supplierCategoryMap.findMany({
      include: {
        supplier: { select: { name: true } },
        category: { select: { name: true } }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ success: true, data: mappings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { supplierId, supplierCategoryName, internalCategoryId } = await req.json();

    if (!supplierId || !supplierCategoryName || !internalCategoryId) {
       return NextResponse.json({ success: false, message: 'Date incomplete.' }, { status: 400 });
    }

    // Upsert the mapping rule
    const existing = await prisma.supplierCategoryMap.findFirst({
        where: { 
            supplierId: parseInt(supplierId, 10), 
            supplierCategoryName 
        }
    });

    if (existing) {
       await prisma.supplierCategoryMap.update({
           where: { id: existing.id },
           data: { internalCategoryId: parseInt(internalCategoryId, 10) }
       });
    } else {
       await prisma.supplierCategoryMap.create({
           data: {
               supplierId: parseInt(supplierId, 10),
               supplierCategoryName,
               internalCategoryId: parseInt(internalCategoryId, 10)
           }
       });
    }

    return NextResponse.json({ success: true, message: 'Regulă de mapare salvată cu succes.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
