import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    } catch {
        return null;
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
    const prisma = getPrisma();
    try {
        const user = verifyToken(request);
        if (!user) {
            const resp = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            resp.headers.set('Access-Control-Allow-Origin', '*');
            return resp;
        }

        const userId = user.userId; // The Admin Installer ID

        const orders = await prisma.b2BOrder.findMany({
            where: { installerId: userId },
            orderBy: { createdAt: 'desc' }
        });

        const respData = orders.map(o => {
            // Un order 'processing' achitat cu cardul poate primi altfel documentul, momentan facem mapping standard:
            const isProforma = (o.status === 'new');
            const itemsList = Array.isArray(o.items) ? o.items : 
                       (typeof o.items === 'string' ? JSON.parse(o.items) : []);
                       
            return {
                id: o.id,
                date: o.createdAt,
                status: o.status,
                totalAmount: o.totalAmount,
                authorName: (o as any).authorName || null,
                documentType: isProforma ? 'Proformă' : 'Factură Fiscală',
                pdfUrl: `/mobile/b2b-invoices/${o.id}/invoice`,
                items: itemsList.map((i: any) => ({
                    id: i.productId || i.id,
                    name: i.name || `Produs B2B #${i.productId}`,
                    quantity: i.quantity,
                    price: i.price
                }))
            };
        });

        const resp = NextResponse.json({ success: true, invoices: respData }, { status: 200 });
        resp.headers.set('Access-Control-Allow-Origin', '*');
        return resp;
    } catch (error) {
        console.error('Mobile B2B Invoices Error:', error);
        const resp = NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
        resp.headers.set('Access-Control-Allow-Origin', '*');
        return resp;
    }
}
