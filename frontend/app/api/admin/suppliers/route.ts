import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

// GET: List all suppliers
export async function GET(request: Request) {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                name: 'asc'
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
        const { name, cui, contact, phone, email, address } = body;

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
                active: true
            }
        });

        return NextResponse.json({ success: true, supplier });
    } catch (error) {
        console.error("Failed to create supplier:", error);
        return NextResponse.json({ success: false, error: 'Failed to create supplier' }, { status: 500 });
    }
}
