import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// Helper for consistency
const prisma = getPrisma();

// GET all B2B Orders for Admin
export async function GET(request: Request) {
    try {
        const orders = await prisma.b2BOrder.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Extract all installerIds to fetch their profiles
        const installerIds = [...new Set(orders.map(o => o.installerId))];
        
        const profiles = await prisma.installerProfile.findMany({
            where: {
                userId: { in: installerIds }
            },
            select: {
                userId: true,
                companyName: true,
                name: true,
                phone: true
            }
        });

        // Map profiles for O(1) lookup
        const profileMap: Record<string, any> = {};
        profiles.forEach(p => {
            profileMap[p.userId] = p;
        });

        // Attach profile metadata to each order
        const enhancedOrders = orders.map(order => ({
            ...order,
            installerProfile: profileMap[order.installerId] || null
        }));
        
        return NextResponse.json({ success: true, orders: enhancedOrders });
    } catch (error) {
        console.error('B2B Orders Admin GET Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la preluarea comenzilor.' }, { status: 500 });
    }
}

// PUT to update status of a B2B Order
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({ success: false, message: 'Date incomplete.' }, { status: 400 });
        }

        const updatedOrder = await prisma.b2BOrder.update({
            where: { id: Number(orderId) },
            data: { status: status }
        });

        // ==========================================
        // SMART STOCK AUTOMATION: inject items on Delivery!
        // ==========================================
        if (status === 'delivered') {
            // Check if we already processed this order to prevent duplicate stock entries 
            // if admin toggles 'delivered' multiple times.
            const existingTx = await prisma.stockTransaction.findFirst({
                where: { 
                    installerId: updatedOrder.installerId,
                    documentRef: `C-B2B #${updatedOrder.id}` 
                }
            });

            if (!existingTx) {
                const b2bItems = updatedOrder.items as any[];
                if (Array.isArray(b2bItems)) {
                    for (const item of b2bItems) {
                        const itemName = item.name || 'Produs Divers B2B';
                        const qty = Number(item.quantity) || 1;
                        
                        // Upsert Inventory Record
                        const stockInst = await prisma.stockItem.upsert({
                            where: {
                                installerId_name: {
                                    installerId: updatedOrder.installerId,
                                    name: itemName
                                }
                            },
                            create: {
                                installerId: updatedOrder.installerId,
                                name: itemName,
                                type: (itemName.toLowerCase().includes('aer conditionat') || itemName.toLowerCase().includes('aparat') || itemName.toLowerCase().includes('pompa')) ? 'echipament' : 'material',
                                stock: qty,
                                unit: 'buc'
                            },
                            update: {
                                stock: { increment: qty }
                            }
                        });

                        // Append Historical Ledger Trace
                        await prisma.stockTransaction.create({
                            data: {
                                installerId: updatedOrder.installerId,
                                stockItemId: stockInst.id,
                                type: 'in',
                                quantity: qty,
                                source: 'b2b_shop',
                                documentRef: `C-B2B #${updatedOrder.id}`
                            }
                        });
                    }
                }
            }
        }
        // ==========================================

        // Fetch Push Token to notify Installer
        const installerProfile = await prisma.installerProfile.findUnique({
            where: { userId: updatedOrder.installerId }
        });

        if (installerProfile && (installerProfile as any).expoPushToken) {
            const token = (installerProfile as any).expoPushToken;
            let statusLabel = status;
            switch(status) {
                case 'processing': statusLabel = 'În procesare'; break;
                case 'shipped': statusLabel = 'Expediată'; break;
                case 'delivered': statusLabel = 'Livrată'; break;
                case 'canceled': statusLabel = 'Anulată'; break;
            }

            try {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: token,
                        sound: 'default',
                        title: 'Actualizare Comandă B2B',
                        body: `Comanda ta (#${updatedOrder.id}) are acum statusul: ${statusLabel}.`,
                        data: { route: '/(tabs)/orders' },
                    })
                });
            } catch (pushErr) {
                console.error('Failed to send push notification:', pushErr);
            }
        }

        return NextResponse.json({ success: true, order: updatedOrder, message: 'Status actualizat cu succes.' });
    } catch (error) {
        console.error('B2B Order Status Update Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la actualizarea comenzii.' }, { status: 500 });
    }
}

// DELETE a B2B Order
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 });
        }

        await prisma.b2BOrder.delete({
            where: { id: Number(orderId) }
        });

        return NextResponse.json({ success: true, message: 'Comanda a fost ștearsă cu succes.' });
    } catch (error) {
        console.error('B2B Order Delete Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la ștergerea comenzii.' }, { status: 500 });
    }
}
