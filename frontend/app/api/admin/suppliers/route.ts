import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export const dynamic = 'force-dynamic';

// GET: List all suppliers with relation bounds
export async function GET(request: Request) {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true, unmapped: true }
                },
                scraperJobs: {
                    orderBy: { updatedAt: 'desc' },
                    take: 1
                }
            }
        });
        return NextResponse.json({ success: true, suppliers });
    } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}

// POST: Create a new supplier
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, cui, contact, phone, email, address, websiteUrl, crawlerConfig, defaultMarginValue, defaultMarginType, supplierRole, competitorUndercut } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Missing Name' }, { status: 400 });
        }

        const supplier = await prisma.supplier.create({
            data: {
                name,
                cui,
                contact,
                phone,
                email,
                address,
                websiteUrl,
                crawlerConfig: crawlerConfig ? crawlerConfig : {},
                active: true,
                supplierRole: supplierRole || "CORE",
                competitorUndercut: competitorUndercut !== undefined && competitorUndercut !== '' ? parseFloat(competitorUndercut) : 0.50,
                defaultMarginValue: defaultMarginValue !== undefined && defaultMarginValue !== '' ? parseFloat(defaultMarginValue) : 10,
                defaultMarginType: defaultMarginType || "PERCENT"
            }
        });

        return NextResponse.json({ success: true, supplier });
    } catch (error) {
        console.error("Failed to create supplier:", error);
        return NextResponse.json({ success: false, error: 'Failed to create supplier' }, { status: 500 });
    }
}
