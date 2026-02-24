import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

// POST: Create a new B2B Order
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { installerId, items, totalAmount } = body;

        if (!installerId || !items || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Create Order
        // Cast to any to avoid stale type error after schema push
        const order = await (prisma as any).b2BOrder.create({
            data: {
                installerId,
                status: 'new',
                items: items, // Pass directly as JSON
                totalAmount: parseFloat(totalAmount)
            }
        });

        // TODO: Send email notification to Admin

        return NextResponse.json({ success: true, orderId: order.id });

    } catch (error) {
        console.error("B2B Order Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
    }
}

// GET: Fetch orders (for Admin or Installer)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const installerId = searchParams.get('installerId');

        const where: any = {};
        if (installerId) where.installerId = installerId;

        const orders = await (prisma as any).b2BOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Items are already JSON if using Prisma Json type, but let's ensure parsing if needed
        const parsedOrders = orders.map((o: any) => ({
            ...o,
            items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
        }));

        return NextResponse.json({ success: true, orders: parsedOrders });

    } catch (error) {
        console.error("B2B Fetch Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
}
