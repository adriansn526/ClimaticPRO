import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function POST(req: Request) {
  try {
    const { unmappedId } = await req.json();

    if (!unmappedId) {
      return NextResponse.json({ success: false, message: 'ID lipsă.' }, { status: 400 });
    }

    await prisma.unmappedSupplierProduct.update({
      where: { id: parseInt(unmappedId) },
      data: { status: 'ignored' }
    });

    return NextResponse.json({ success: true, message: 'Produs ignorat cu succes.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
