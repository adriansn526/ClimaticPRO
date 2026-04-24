import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const { autoSync } = await request.json();

        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: { autoSync }
        });

        return NextResponse.json({ success: true, supplier: updatedSupplier });
    } catch (error) {
        console.error("Failed to update supplier autoSync:", error);
        return NextResponse.json({ success: false, error: 'Eroare server.' }, { status: 500 });
    }
}
