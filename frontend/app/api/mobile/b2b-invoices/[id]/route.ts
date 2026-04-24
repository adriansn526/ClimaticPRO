import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();

export const dynamic = 'force-dynamic';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    } catch {
        return null;
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }
        
        const installerId = user.userId || user.id;

        const { params } = context;
        const orderId = Number(params.id);

        if (isNaN(orderId)) {
            return NextResponse.json({ success: false, message: 'ID comandă invalid.' }, { status: 400 });
        }

        const order = await prisma.b2BOrder.findUnique({
            where: { id: orderId }
        });

        if (!order || order.installerId !== installerId) {
            return NextResponse.json({ success: false, message: 'Comanda nu a fost găsită sau nu îți aparține' }, { status: 404 });
        }

        if (order.status !== 'new' && order.status !== 'processing') {
            return NextResponse.json({ success: false, message: 'Nu poți șterge o comandă care a fost deja expediată sau procesată complet.' }, { status: 400 });
        }

        // Delete the order entirely
        await prisma.b2BOrder.delete({
            where: { id: orderId }
        });

        return NextResponse.json({ success: true, message: 'Comandă ștearsă cu succes.' });

    } catch (error) {
        console.error('[MOBILE B2B DELETE API] Server Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă la ștergere.' }, { status: 500 });
    }
}
