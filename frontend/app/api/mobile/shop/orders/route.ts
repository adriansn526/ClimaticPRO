import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'secret';
        
        let decoded: any;
        try {
            decoded = jwt.verify(token, secret);
        } catch {
            return NextResponse.json({ success: false, message: 'Token invalid' }, { status: 401 });
        }

        const orders = await prisma.b2BOrder.findMany({
            where: { installerId: decoded.id },
            orderBy: { createdAt: 'desc' }
        });

        // Parse items back so mobile can render easily
        const formattedOrders = orders.map((o) => {
            let parsedItems = [];
            try {
                if (typeof o.items === 'string') {
                    parsedItems = JSON.parse(o.items);
                } else if (typeof o.items === 'object') {
                    parsedItems = o.items;
                }
            } catch (e) {
                console.error("Error parsing order items", e);
            }

            return {
                id: o.id,
                status: o.status,
                totalAmount: o.totalAmount,
                createdAt: o.createdAt,
                documentUrls: o.documentUrls,
                paymentStatus: o.paymentStatus,
                paymentMethod: o.paymentMethod,
                items: parsedItems
            };
        });

        return NextResponse.json({ success: true, orders: formattedOrders });
        
    } catch (error) {
        console.error('Fetch B2B Orders Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă de server' }, { status: 500 });
    }
}
