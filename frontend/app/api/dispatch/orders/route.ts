import { NextResponse } from 'next/server';
import { getWooCommerceOrders, updateWooCommerceOrder } from '@/lib/woo-admin';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

// GET: Fetch Orders for Admin or Installer
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role'); // admin | installer
        const region = searchParams.get('region');

        let wooParams: any = {
            per_page: 50,
            status: 'processing,completed,on-hold' // Adjust as needed
        };

        const orders = await getWooCommerceOrders(wooParams);

        // Filter and Transform for Frontend
        // We look for Meta Data: _climatic_dispatch_status
        const mappedOrders = orders.map((o: any) => {
            const metaStatus = o.meta_data.find((m: any) => m.key === '_climatic_dispatch_status')?.value || 'new';
            const metaRegion = o.meta_data.find((m: any) => m.key === '_climatic_dispatch_region')?.value || o.billing.state || 'Unknown';

            return {
                id: o.id,
                client: `${o.billing.first_name} ${o.billing.last_name}`,
                address: o.billing.address_1,
                phone: o.billing.phone,
                product: o.line_items[0]?.name || 'Produs necunoscut',
                region: metaRegion,
                status: metaStatus,
                date: new Date(o.date_created).toLocaleDateString('ro-RO'),
                raw_total: o.total
            };
        });

        // Filter based on Role/Region logic
        let finalOrders = mappedOrders;
        if (role === 'installer' && region) {
            // Installer sees only Broadcasted orders in their region or Assigned to them
            finalOrders = mappedOrders.filter((o: any) =>
                (o.status === 'broadcasted' && o.region.includes(region)) ||
                (o.status === 'assigned') // TODO: Check if assigned to THIS installer
            );
        }

        return NextResponse.json({ success: true, orders: finalOrders });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// PUT: Broadcast or Accept
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { orderId, action, region, installerName } = body;
        // action: 'broadcast' | 'accept'

        let updateData = {};

        if (action === 'broadcast') {
            updateData = {
                meta_data: [
                    { key: '_climatic_dispatch_status', value: 'broadcasted' },
                    { key: '_climatic_dispatch_region', value: region }
                ]
            };
        } else if (action === 'accept') {
            updateData = {
                meta_data: [
                    { key: '_climatic_dispatch_status', value: 'assigned' },
                    { key: '_climatic_installer_name', value: installerName || 'Unknown Installer' }
                ]
            };

            // SYNC TO POSTGRES JOB TABLE
            try {
                const fullOrder = await getWooCommerceOrders({ include: [orderId] });
                const orderData = fullOrder[0];

                if (orderData) {
                    // user is passed via body? We need installer ID.
                    // For now assuming the body contains 'installerId' passed from frontend.
                    // If not, we might need to fetch it or pass it.
                    // The frontend call sends: orderId, action, installerName.
                    // We need to add 'installerId' to the frontend call in InstallerDashboard.
                    if (body.installerId) {
                        await prisma.job.create({
                            data: {
                                title: `Instalare #${orderId}: ${orderData.line_items[0]?.name || 'Produs'}`,
                                clientName: `${orderData.billing.first_name} ${orderData.billing.last_name}`,
                                clientPhone: orderData.billing.phone,
                                address: `${orderData.billing.address_1}, ${orderData.billing.city}`,
                                status: 'pending',
                                installerId: body.installerId,
                                metadata: {
                                    products: orderData.line_items.map((p: any) => ({
                                        id: p.id,
                                        name: p.name,
                                        price: p.price,
                                        type: p.name.toLowerCase().includes('kit') ? 'accessory' : 'ac'
                                    })),
                                    email: orderData.billing.email,
                                    wooOrderId: orderId
                                }
                            }
                        });
                    }
                }
            } catch (dbError) {
                console.error("Failed to create Job record:", dbError);
                // Continue, don't block WC update
            }
        }

        const result = await updateWooCommerceOrder(orderId, updateData);
        return NextResponse.json({ success: true, order: result });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}
