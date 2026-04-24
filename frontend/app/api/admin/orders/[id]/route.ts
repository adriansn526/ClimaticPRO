import { NextResponse } from 'next/server';
import { getWooCommerceOrders } from '@/lib/woo-admin';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: { id: string } }) {
    try {
        const orderId = parseInt(context.params.id);
        if (!orderId || isNaN(orderId)) {
            return NextResponse.json({ success: false, message: 'ID invalid' }, { status: 400 });
        }

        // Fetch WooCommerce Order
        const wooOrders = await getWooCommerceOrders({ include: [orderId] });
        if (!wooOrders || wooOrders.length === 0) {
            return NextResponse.json({ success: false, message: 'Comanda nu a fost gasită' }, { status: 404 });
        }
        const order = wooOrders[0];

        // Extrage metadatele de bază
        const metaStatus = order.meta_data.find((m: any) => m.key === '_climatic_dispatch_status')?.value || 'new';
        let customerNote = order.customer_note || '';
        if (!customerNote) {
            customerNote = order.meta_data.find((m: any) => m.key === 'customer_note' || m.key === 'nota_client')?.value || '';
        }
        const dispatchNote = order.meta_data.find((m: any) => m.key === '_dispatch_admin_note')?.value || '';

        // Fetch Job din Prisma pentru a aduce Checklist, Poze si Extracosturi (Daca order-ul a fost acceptat de instalator)
        const prisma = getPrisma();
        const localJob = await prisma.job.findUnique({
            where: { id: orderId }
        });

        // Formatează un Payload consolidat, ideal pentru Single Source of Truth
        const payload = {
            id: order.id,
            status: metaStatus,
            dateCreated: order.date_created,
            customer: {
                name: `${order.billing.first_name} ${order.billing.last_name}`,
                address: order.billing.address_1,
                city: order.billing.city,
                state: order.billing.state,
                phone: order.billing.phone,
                email: order.billing.email
            },
            financial: {
                total: order.total,
                paymentMethod: order.payment_method_title || order.payment_method
            },
            notes: {
                customerNote,
                dispatchNote
            },
            products: order.line_items.map((item: any) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                total: item.total,
                sku: item.sku
            })),
            localJob: localJob ? {
                id: localJob.id,
                status: localJob.status,
                installerId: localJob.installerId,
                clientName: localJob.clientName,
                clientPhone: localJob.clientPhone,
                address: localJob.address,
                metadata: localJob.metadata // Aici o sa gasim pozele si fisierele predate `media` & `checklist` & `extraCosts` & `products` B2B
            } : null
        };

        return NextResponse.json({ success: true, order: payload });
    } catch (error: any) {
        console.error('Eroare in /api/admin/orders/[id]:', error.message);
        return NextResponse.json({ success: false, message: 'Eroare de server' }, { status: 500 });
    }
}
