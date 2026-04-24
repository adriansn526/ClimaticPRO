import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: any) {
    try {
        const { id } = context.params;
        const stockItemId = parseInt(id, 10);
        
        if (isNaN(stockItemId)) {
            return NextResponse.json({ success: false, message: 'ID Invalid' }, { status: 400 });
        }

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

        const body = await request.json();
        const { amount, source } = body; // amount can be +1 or -1, etc.
        const parsedAmount = parseFloat(String(amount));

        if (isNaN(parsedAmount) || parsedAmount === 0) {
            return NextResponse.json({ success: false, message: 'Cantitate invalidă' }, { status: 400 });
        }

        const currentStock = await (prisma as any).stockItem.findUnique({
            where: { id: stockItemId }
        });

        if (!currentStock || currentStock.installerId !== (decoded.userId || decoded.id)) {
            return NextResponse.json({ success: false, message: 'Produs negăsit sau nu aveți acces' }, { status: 404 });
        }

        const newStock = Math.max(0, currentStock.stock + parsedAmount);

        // Update the item
        await (prisma as any).stockItem.update({
            where: { id: stockItemId },
            data: { stock: newStock }
        });

        // Track transaction
        await (prisma as any).stockTransaction.create({
            data: {
                installerId: currentStock.installerId,
                stockItemId: stockItemId,
                type: 'adjustment',
                quantity: parsedAmount,
                source: source || 'manual'
            }
        });

        return NextResponse.json({ success: true, newStock });
    } catch (error) {
        console.error('Adjust stock error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă' }, { status: 500 });
    }
}
