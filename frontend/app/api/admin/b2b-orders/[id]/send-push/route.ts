import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export async function POST(request: Request, context: any) {
    try {
        const { params } = context;
        const orderId = Number(params.id);

        if (isNaN(orderId)) {
            return NextResponse.json({ success: false, message: 'ID Invalid' }, { status: 400 });
        }

        const order = await prisma.b2BOrder.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ success: false, message: 'Comanda nu există.' }, { status: 404 });
        }

        const profile = await prisma.installerProfile.findUnique({
            where: { userId: order.installerId }
        });

        if (!profile) {
            return NextResponse.json({ success: false, message: 'Utilizatorul nu are profil valid.' }, { status: 400 });
        }

        const isProforma = (order.status === 'new' || order.status === 'processing');
        const docName = isProforma ? 'Factura Proformă' : 'Factura Fiscală';

        // Trimitere către Expo Push Notification Servers
        let pushStatus = 'Nu a fost trimis Push';
        if ((profile as any).pushToken) {
            const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: (profile as any).pushToken,
                    sound: 'default',
                    title: `${docName} Emisă (#${orderId})`,
                    body: `ClimaticPRO a emis documentele pentru Comanda B2B. O poți descărca din Inbox.`,
                    data: { route: 'furnizori', orderId: orderId }
                }),
            });
            if (pushRes.ok) pushStatus = `Push: ${docName} trimis către Dispozitiv!`;
        }

        // Salvare in Inbox (Baza de date AppNotification)
        await (prisma as any).appNotification.create({
            data: {
                installerId: order.installerId,
                title: `${docName} Emisă (#${orderId})`,
                message: `ClimaticPRO a emis documentele aferente din Comanda B2B - #${orderId}. Documentul este disponibil pentru descărcare permanentă în Arhiva Dvs.`,
                type: 'INVOICE',
                link: orderId.toString(),
                isRead: false
            }
        });

        return NextResponse.json({ success: true, message: pushStatus }, { status: 200 });

    } catch (error) {
        console.error('Push Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare Internă Server' }, { status: 500 });
    }
}
