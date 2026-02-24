import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

// PUT: Update Supplier
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { name, cui, contact, phone, email, address, active } = body;

        const updated = await prisma.supplier.update({
            where: { id: parseInt(id) },
            data: {
                name,
                cui,
                contact,
                phone,
                email,
                address,
                active
            }
        });

        return NextResponse.json({ success: true, supplier: updated });

    } catch (error) {
        console.error("Failed to update supplier:", error);
        return NextResponse.json({ success: false, error: 'Failed to update supplier' }, { status: 500 });
    }
}

// DELETE: Delete (or deactivate) Supplier
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        // Hard delete for now, or could just set active = false
        await prisma.supplier.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: 'Deleted successfully' });

    } catch (error) {
        console.error("Failed to delete supplier:", error);
        return NextResponse.json({ success: false, error: 'Failed to delete supplier' }, { status: 500 });
    }
}
