import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper to add CORS to responses
const setCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

// Real Token verification logic
function verifyToken(request: Request) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';
    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch {
        return null;
    }
}

// GET: Retrieve all stock items for the logged in Installer
export async function GET(request: Request) {
    try {
        const user = verifyToken(request) as any;
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const installerId = user.userId || user.id;

        const stocks = await prisma.stockItem.findMany({
            where: {
                installerId: installerId.toString()
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Get recent transactions as well
        const transactions = await prisma.stockTransaction.findMany({
            where: {
                installerId: installerId.toString()
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        const installerProfile = await prisma.installerProfile.findUnique({
            where: { userId: installerId.toString() },
            select: { isInternal: true }
        });

        return setCors(NextResponse.json({ 
            success: true, 
            stocks, 
            transactions,
            isInternal: !!installerProfile?.isInternal
        }));

    } catch (error) {
        console.error('Fetch Stocks Error:', error);
        return setCors(NextResponse.json({ success: false, message: 'Eroare la preluare stocuri' }, { status: 500 }));
    }
}

// POST: Adjust stock (Add / Subtract / Set)
export async function POST(request: Request) {
    try {
        const user = verifyToken(request) as any;
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }
        const installerId = user.userId || user.id;

        const data = await request.json();
        const { itemId, name, type, quantity, operation, source, documentRef } = data;
        // operation: 'add', 'subtract', 'set'

        if (!quantity) {
            return setCors(NextResponse.json({ success: false, message: 'Cantitate invalidă' }, { status: 400 }));
        }

        let currentItem = itemId ? await prisma.stockItem.findUnique({ where: { id: parseInt(itemId) } }) : null;

        // If it doesn't exist but a name was provided (e.g., from SPV auto-import), create it
        if (!currentItem && name) {
            currentItem = await prisma.stockItem.create({
                data: {
                    installerId: installerId.toString(),
                    name: name,
                    type: type || 'material',
                    stock: 0,
                    unit: 'buc'
                }
            });
        }

        if (!currentItem) {
            return setCors(NextResponse.json({ success: false, message: 'Produsul nu a fost găsit în stoc.' }, { status: 404 }));
        }

        // Calculate new stock
        let newStock = currentItem.stock;
        let diff = parseFloat(quantity);

        if (operation === 'add') {
            newStock += diff;
        } else if (operation === 'subtract') {
            newStock = Math.max(0, newStock - diff);
        } else if (operation === 'set') {
            diff = parseFloat(quantity) - newStock;
            newStock = parseFloat(quantity);
        }

        // Update StockItem
        const updatedItem = await prisma.stockItem.update({
            where: { id: currentItem.id },
            data: { stock: newStock }
        });

        // Record Transaction only if there's a difference
        if (diff !== 0) {
            await prisma.stockTransaction.create({
                data: {
                    installerId: installerId.toString(),
                    stockItemId: currentItem.id,
                    type: diff > 0 ? 'in' : 'out',
                    quantity: Math.abs(diff),
                    source: source || 'manual',
                    documentRef: documentRef || null
                }
            });
        }

        return setCors(NextResponse.json({ success: true, stockItem: updatedItem }));

    } catch (error) {
        console.error('Update Stock Error:', error);
        return setCors(NextResponse.json({ success: false, message: 'Eroare la modificarea stocului' }, { status: 500 }));
    }
}

// DELETE: Remove a stock item entirely
export async function DELETE(request: Request) {
    try {
        const user = verifyToken(request) as any;
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }
        const installerId = user.userId || user.id;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return setCors(NextResponse.json({ success: false, message: 'ID lipsă' }, { status: 400 }));
        }

        // Verify ownership
        const item = await prisma.stockItem.findUnique({ where: { id: parseInt(id) } });
        if (!item || item.installerId !== installerId.toString()) {
            return setCors(NextResponse.json({ success: false, message: 'Produs negăsit sau neautorizat' }, { status: 404 }));
        }

        await prisma.stockItem.delete({
            where: { id: parseInt(id) }
        });

        return setCors(NextResponse.json({ success: true, message: 'Produs șters.' }));

    } catch (error) {
        console.error('Delete Stock Error:', error);
        return setCors(NextResponse.json({ success: false, message: 'Eroare la ștergerea stocului' }, { status: 500 }));
    }
}

export async function OPTIONS() {
    return setCors(new NextResponse(null, { status: 200 }));
}
