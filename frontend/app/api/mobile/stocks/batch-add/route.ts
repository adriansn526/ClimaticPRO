import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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

        const installerId = decoded.userId || decoded.id;

        // Verify if user is Internal
        const installerProfile = await (prisma as any).installerProfile.findUnique({
            where: { userId: installerId }
        });

        if (!installerProfile?.isInternal) {
            return NextResponse.json({ success: false, message: 'Disponibil doar forței de muncă interne.' }, { status: 403 });
        }

        const body = await request.json();
        const { items, source, documentUrl } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ success: false, message: 'Lista de produse este invalidă.' }, { status: 400 });
        }

        let operationsDone = 0;

        // Iterate sequentially because we need to check existence and fallback to create / update
        for (const item of items) {
            const { name, quantity, unit, price } = item;
            
            if (!name || !quantity) continue;
            
            const parsedQty = parseFloat(String(quantity).replace(',', '.'));
            if (isNaN(parsedQty) || parsedQty <= 0) continue;

            const parsedPrice = parseFloat(String(price || 0).replace(',', '.'));
            const finalPrice = isNaN(parsedPrice) ? 0 : parsedPrice;

            const normalizedName = String(name).trim();
            const normalizedUnit = String(unit || 'buc').trim().toLowerCase();
            const parsedType = item.type ? String(item.type).trim().toLowerCase() : 'material';

            // Find existing StockItem
            let currentStock = await (prisma as any).stockItem.findUnique({
                where: {
                    installerId_name: {
                        installerId: installerId,
                        name: normalizedName
                    }
                }
            });

            if (currentStock) {
                currentStock = await (prisma as any).stockItem.update({
                    where: { id: currentStock.id },
                    data: { 
                        stock: currentStock.stock + parsedQty,
                        ...(finalPrice > 0 && { price: finalPrice }),
                        // If type explicitly extracted and different from current, do we update? Yes, trust the new scan
                        type: parsedType !== 'material' ? parsedType : currentStock.type 
                    }
                });
            } else {
                currentStock = await (prisma as any).stockItem.create({
                    data: {
                        installerId: installerId,
                        name: normalizedName,
                        type: parsedType,
                        unit: normalizedUnit,
                        stock: parsedQty,
                        price: finalPrice
                    }
                });
            }

            // Record transaction
            await (prisma as any).stockTransaction.create({
                data: {
                    installerId: installerId,
                    stockItemId: currentStock.id,
                    type: 'in',
                    quantity: parsedQty,
                    unitPrice: finalPrice,
                    source: source || 'ocr',
                    documentUrl: documentUrl || null
                }
            });

            operationsDone++;
        }

        return NextResponse.json({ success: true, message: `Au fost recepționate ${operationsDone} poziții în gestiune.` });

    } catch (error) {
        console.error('Batch Add Stock Error:', error);
        return NextResponse.json({ success: false, message: 'Server Eroare internă' }, { status: 500 });
    }
}
