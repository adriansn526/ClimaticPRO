import { NextResponse } from 'next/server';
import { getWooCommerceOrders, updateWooCommerceOrder, deleteWooCommerceOrder } from '@/lib/woo-admin';
import { getPrisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

const prisma = getPrisma();

// GET: Fetch Orders for Admin or Installer
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role'); // admin | installer
        const region = searchParams.get('region');

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - 120); // Extragem date doar din ultimele 120 de zile
        
        let wooParams: any = {
            per_page: 50,
            status: 'processing,completed,on-hold,pending', // Include pending as COD orders land here
            after: daysAgo.toISOString()
        };

        const orders = await getWooCommerceOrders(wooParams);

        // Filter and Transform for Frontend
        // We look for Meta Data: _climatic_dispatch_status
        // Map WooCommerce abbreviated regions
        const regionMap: Record<string, string> = {
            'B': 'Bucuresti',
            'IF': 'Ilfov',
            'SV': 'Suceava',
            'GR': 'Giurgiu'
        };

        const mappedOrders = orders.map((o: any) => {
            const metaStatus = o.meta_data.find((m: any) => m.key === '_climatic_dispatch_status')?.value || 'new';
            let rawRegion = o.meta_data.find((m: any) => m.key === '_climatic_dispatch_region')?.value || o.billing.state || 'Unknown';
            const metaRegion = regionMap[rawRegion] || rawRegion;

            const targetedInstaller = o.meta_data.find((m: any) => m.key === '_climatic_targeted_installer')?.value || null;
            const installerName = o.meta_data.find((m: any) => m.key === '_climatic_installer_name')?.value || null;

            let appointmentDateStr = 'Neprogramat';
            const rawAppointment = o.meta_data.find((m: any) => m.key === 'appointment_date' || m.key === 'programare_instalare')?.value;
            if (rawAppointment) {
                try {
                    const d = new Date(rawAppointment);
                    appointmentDateStr = d.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: '2-digit', month: 'long', year: 'numeric' });
                } catch {
                    appointmentDateStr = rawAppointment;
                }
            }

            return {
                id: o.id,
                client: `${o.billing.first_name} ${o.billing.last_name}`,
                address: o.billing.address_1,
                phone: o.billing.phone,
                product: o.line_items[0]?.name || 'Produs necunoscut',
                region: metaRegion,
                status: metaStatus,
                date: new Date(o.date_created).toLocaleDateString('ro-RO'),
                raw_total: o.total,
                _targetedInstaller: targetedInstaller,
                installer: installerName,
                appointmentDate: appointmentDateStr,
                rawAppointmentDate: rawAppointment
            };
        });

        // ----------------------------------------------------
        // Auto-Assign Logic Interception
        // ----------------------------------------------------
        const newOrders = mappedOrders.filter((o: any) => o.status === 'new');
        
        if (newOrders.length > 0 && (role === 'admin' || role === 'installer')) {
            const autoAssignInstaller = await prisma.installerProfile.findFirst({
                where: { isAutoAssignEnabled: true, status: 'approved' }
            });

            if (autoAssignInstaller) {
                const installerName = autoAssignInstaller.companyName || autoAssignInstaller.name || 'Instalator Automat';
                for (const o of newOrders) {
                    try {
                        const updateData = {
                            meta_data: [
                                { key: '_climatic_dispatch_status', value: 'broadcasted' },
                                { key: '_climatic_targeted_installer', value: autoAssignInstaller.userId },
                                { key: '_climatic_installer_name', value: `Exclusiv: ${installerName}` }
                            ]
                        };

                        // 1. Update WooCommerce Order directly (Status: broadcasted + Target)
                        await updateWooCommerceOrder(o.id.toString(), updateData);

                        // 2. Trimite Push Notification dace are Expo Token
                        if (autoAssignInstaller.expoPushToken) {
                            fetch('https://exp.host/--/api/v2/push/send', {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Accept-encoding': 'gzip, deflate',
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    to: autoAssignInstaller.expoPushToken,
                                    sound: 'default',
                                    title: 'Comandă Nouă Exclusivă',
                                    body: `Ai primit o comandă #${o.id} pentru ${o.product}. Deschide aplicația pentru a o accepta!`,
                                    data: { orderId: o.id },
                                })
                            }).catch(e => console.error("Failed to send Expo Push", e));
                        }

                        // 3. Update memory object so Admin sees it broadcasted immediately
                        o.status = 'broadcasted';
                        o.installer = `Exclusiv: ${installerName}`;
                        o._targetedInstaller = autoAssignInstaller.userId;

                    } catch (err) {
                        console.error("Auto assign failed for order", o.id, err);
                    }
                }
            }
        }

        // Filter based on Role/Region logic
        let finalOrders = mappedOrders;
        if (role === 'installer' && region) {
            // Region might be multiple separated by commas e.g. "Bucuresti,Ilfov"
            const acceptedRegions = region.split(',').map(r => r.trim().toLowerCase());
            const currentUserId = searchParams.get('userId');

            finalOrders = mappedOrders.filter((o: any) => {
                if (o.status !== 'broadcasted') return false;

                // Targeted Broadcast check
                if (o._targetedInstaller) {
                    if (o._targetedInstaller !== currentUserId) {
                        return false; // Exclusiv pentru altcineva
                    } else {
                        return true; // Exclusiv pentru ACEST instalator -> treci peste filtrul de regiune!
                    }
                }

                const orderRegionLow = o.region.toLowerCase();
                
                // Allow "S 1" ... "S 6" to match "Bucuresti"
                if (acceptedRegions.includes('bucuresti') && (orderRegionLow.startsWith('s ') || orderRegionLow.startsWith('sector'))) {
                    return true;
                }

                return acceptedRegions.some(r => orderRegionLow.includes(r)) || orderRegionLow.includes('unknown');
            });
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
        // action: 'broadcast' | 'accept' | 'refuse'

        let updateData = {};

        if (action === 'broadcast') {
            updateData = {
                meta_data: [
                    { key: '_climatic_dispatch_status', value: 'broadcasted' },
                    { key: '_climatic_dispatch_region', value: region }
                ]
            };
        } else if (action === 'update_admin_note') {
            const { note } = body;
            updateData = {
                meta_data: [
                    { key: '_dispatch_admin_note', value: note }
                ]
            };
        } else if (action === 'update_details') {
            const { clientName, phone, address, product, newRegion } = body;
            const names = (clientName || '').split(' ');
            const firstName = names[0] || '';
            const lastName = names.slice(1).join(' ');

            updateData = {
                billing: {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    address_1: address
                },
                meta_data: [
                    { key: '_climatic_dispatch_region', value: newRegion || region }
                ]
            };
            
            // Note: Updating product completely requires mapping to a new product ID, 
            // but we can update the line_item name directly if we knew the line_item id. 
            // In API context, updating WooCommerce order line items requires ID. 
            // We skip updating product name directly in WC to prevent billing desyncs, 
            // but it'll remain visible on frontend via local memory if passed.
            
        } else if (action === 'update_date') {
            const { newDate } = body;
            updateData = {
                meta_data: [
                    { key: 'appointment_date', value: newDate },
                    { key: '_appointment_date', value: newDate },
                    { key: 'programare_instalare', value: newDate }
                ]
            };

            // SYNC TO POSTGRES JOB IF IT EXISTS
            try {
                const existingJob = await prisma.job.findFirst({
                    where: { metadata: { path: ['wooOrderId'], equals: Number(orderId) } }
                });
                if (!existingJob) {
                    const fallbackJob = await prisma.job.findFirst({
                        where: { title: { contains: `#${orderId}` } }
                    });
                    if (fallbackJob) {
                        const newMeta = fallbackJob.metadata as any || {};
                        newMeta.rawAppointmentDate = newDate;
                        await prisma.job.update({ where: { id: fallbackJob.id }, data: { metadata: newMeta } });
                    }
                } else {
                    const newMeta = existingJob.metadata as any || {};
                    newMeta.rawAppointmentDate = newDate;
                    await prisma.job.update({ where: { id: existingJob.id }, data: { metadata: newMeta } });
                }
            } catch (e) {
                console.error("Date sync to Prisma failed:", e);
            }
        } else if (action === 'refuse') {
            updateData = {
                meta_data: [
                    { key: '_climatic_dispatch_status', value: 'new' }, // Returnes to admin as 'new' for manual broadcast
                    { key: '_climatic_targeted_installer', value: '' } // Clear the targeted installer
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
                        const isMaintenance = orderData.meta_data.some((m: any) => m.key === '_is_maintenance' && m.value === 'yes');
                        const prefix = isMaintenance ? 'Intervenție' : 'Instalare';
                        
                        await prisma.job.create({
                            data: {
                                title: `${prefix} #${orderId}: ${orderData.line_items[0]?.name || 'Serviciu'}`,
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
                                    wooOrderId: orderId,
                                    rawAppointmentDate: orderData.meta_data.find((m: any) => m.key === 'appointment_date' || m.key === 'programare_instalare')?.value || null,
                                    customerNote: orderData.customer_note || null
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
        
        // Force Next.js to drop the cached getWooCommerceOrders response so mobile apps and admin see changes instantly
        revalidateTag('woo-orders');

        return NextResponse.json({ success: true, order: result });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}

// DELETE: Architecturally archive/delete the order from dispatch view
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
        }

        // We use properly the DELETE method
        const result = await deleteWooCommerceOrder(parseInt(orderId));
        
        revalidateTag('woo-orders');
        
        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Delete order failed", error);
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
}

// Handle CORS Preflight requests
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
