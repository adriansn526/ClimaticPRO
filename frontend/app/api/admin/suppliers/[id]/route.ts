import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

// GET: Single Supplier Details
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supplier = await prisma.supplier.findUnique({
            where: { id: parseInt(id) },
            include: {
                products: {
                    include: { product: true }
                },
                unmapped: {
                    orderBy: { lastScrapedAt: 'desc' }
                }
            }
        });

        if (!supplier) {
            return NextResponse.json({ success: false, error: 'Furnizorul nu există' }, { status: 404 });
        }
        return NextResponse.json({ success: true, supplier });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

// PUT: Update Supplier
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { name, cui, contact, phone, email, address, active, websiteUrl, crawlerConfig, defaultMarginValue, defaultMarginType, supplierRole, competitorUndercut } = body;

        const updated = await prisma.supplier.update({
            where: { id: parseInt(id) },
            data: {
                name,
                cui,
                contact,
                phone,
                email,
                address,
                websiteUrl,
                crawlerConfig,
                active,
                supplierRole: supplierRole || "CORE",
                competitorUndercut: competitorUndercut !== undefined && competitorUndercut !== '' ? parseFloat(competitorUndercut) : 0.50,
                defaultMarginValue: defaultMarginValue !== undefined && defaultMarginValue !== '' ? parseFloat(defaultMarginValue) : null,
                defaultMarginType: defaultMarginType || "PERCENT"
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
