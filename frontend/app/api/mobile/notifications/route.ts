import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

        // Get notifications for this installer
        const notifications = await (prisma as any).appNotification.findMany({
            where: { installerId: decoded.id },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50
        });

        // Calculate unread count globally
        const unreadCount = await (prisma as any).appNotification.count({
            where: { installerId: decoded.id, isRead: false }
        });

        return NextResponse.json({ 
            success: true, 
            notifications,
            unreadCount
        });
        
    } catch (error) {
        console.error('Fetch Notifications Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la aducerea notificărilor' }, { status: 500 });
    }
}
