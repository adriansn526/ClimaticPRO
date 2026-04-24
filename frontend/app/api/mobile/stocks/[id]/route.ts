import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, context: any) {
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

        const currentStock = await (prisma as any).stockItem.findUnique({
            where: { id: stockItemId }
        });

        if (!currentStock || currentStock.installerId !== (decoded.userId || decoded.id)) {
            return NextResponse.json({ success: false, message: 'Produs negăsit sau nu aveți acces' }, { status: 404 });
        }

        // Delete associated transactions first to maintain referential integrity
        await (prisma as any).stockTransaction.deleteMany({
            where: { stockItemId: stockItemId }
        });

        // Delete the item
        await (prisma as any).stockItem.delete({
            where: { id: stockItemId }
        });

        return NextResponse.json({ success: true, message: 'Eliminat cu succes' });
    } catch (error) {
        console.error('Delete stock error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă' }, { status: 500 });
    }
}

export async function PUT(request: Request, context: any) {
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

        const installerId = decoded.userId || decoded.id;

        const body = await request.json();
        const { name, stock, price, type, unit } = body;

        let currentStock = await (prisma as any).stockItem.findUnique({
            where: { id: stockItemId }
        });

        if (!currentStock || currentStock.installerId !== installerId) {
            return NextResponse.json({ success: false, message: 'Produs negăsit sau nu aveți acces' }, { status: 404 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (unit !== undefined) updateData.unit = unit;

        const parsedStock = parseFloat(String(stock).replace(',', '.'));
        const parsedPrice = parseFloat(String(price).replace(',', '.'));
        
        if (!isNaN(parsedStock) && parsedStock >= 0) {
            updateData.stock = parsedStock;
        }

        if (!isNaN(parsedPrice) && parsedPrice >= 0) {
            updateData.price = parsedPrice;
        }

        const updatedItem = await (prisma as any).stockItem.update({
            where: { id: stockItemId },
            data: updateData
        });

        return NextResponse.json({ success: true, message: 'Actualizat cu succes', item: updatedItem });
    } catch (error) {
        console.error('Update stock error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă' }, { status: 500 });
    }
}
