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

        const body = await request.json();
        const notificationId = body.id;

        if (!notificationId) {
            return NextResponse.json({ success: false, message: 'ID notificare lipsă' }, { status: 400 });
        }

        // Verify the notification belongs to this user before updating
        const notif = await (prisma as any).appNotification.findUnique({
            where: { id: notificationId }
        });

        const installerId = decoded.userId || decoded.id;
        if (!notif || notif.installerId !== installerId) {
            return NextResponse.json({ success: false, message: 'Notificarea nu poate fi modificată' }, { status: 403 });
        }

        await (prisma as any).appNotification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });
        
    } catch (error) {
        console.error('Update Notification Read Status Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la actualizare' }, { status: 500 });
    }
}
