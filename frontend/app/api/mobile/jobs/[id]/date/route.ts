import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123') as any;
    } catch {
        return null;
    }
}

export async function PUT(request: Request, context: any) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }

        const { id } = context.params;
        if (!id) return NextResponse.json({ success: false, message: 'ID invalid' }, { status: 400 });

        const body = await request.json();
        const { newDate } = body;

        const prisma = getPrisma();
        const job = await prisma.job.findUnique({ where: { id: parseInt(id) } });

        if (!job) {
            return NextResponse.json({ success: false, message: 'Lucrarea nu există' }, { status: 404 });
        }

        if (job.installerId !== user.userId && job.installerId !== user.id?.toString()) {
            return NextResponse.json({ success: false, message: 'Nu ai acces la această lucrare' }, { status: 403 });
        }

        let meta = job.metadata as any || {};
        meta.rawAppointmentDate = newDate;
        
        let appointmentDateStr = 'Neprogramat';
        try {
            const d = new Date(newDate);
            appointmentDateStr = d.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: '2-digit', month: 'long', year: 'numeric' });
        } catch (e) {}
        
        meta.appointmentDate = appointmentDateStr;

        const updatedJob = await prisma.job.update({
            where: { id: parseInt(id) },
            data: { metadata: meta }
        });

        // Optionally, we could call WooCommerce API here to sync it backwards using meta.wooOrderId.
        // Doing it seamlessly:
        if (meta.wooOrderId) {
            try {
                const { updateWooCommerceOrder } = require('@/lib/woocommerce');
                await updateWooCommerceOrder(meta.wooOrderId.toString(), {
                    meta_data: [
                        { key: 'appointment_date', value: newDate },
                        { key: '_appointment_date', value: newDate },
                        { key: 'programare_instalare', value: newDate }
                    ]
                });
            } catch (err) { console.log('Non-critical WC sync issue', err); }
        }

        return NextResponse.json({ success: true, message: 'Dată actualizată!', job: updatedJob });
    } catch (error) {
        console.error('Job Date Update Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă server' }, { status: 500 });
    }
}
