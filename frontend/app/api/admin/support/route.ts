import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const prisma = getPrisma();
    try {
        const url = new URL(req.url);
        const filterStatus = url.searchParams.get('status') || 'ALL'; // OPEN, RESOLVED, ALL

        let whereClause = {};
        if (filterStatus !== 'ALL') {
            whereClause = { status: filterStatus };
        }

        const tickets = await prisma.supportTicket.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });

        const installerIds = [...new Set(tickets.map(t => t.installerId))];
        const profiles = await prisma.installerProfile.findMany({
            where: { userId: { in: installerIds } }
        });

        const profileMap = new Map();
        profiles.forEach(p => profileMap.set(p.userId, p));

        const enrichedTickets = tickets.map(t => {
            const profile = profileMap.get(t.installerId);
            return {
                ...t,
                installerName: profile?.companyName || profile?.name || 'Instalator Necunoscut',
                installerPhone: profile?.phone || '-',
                installerEmail: profile?.email || '-'
            };
        });

        return NextResponse.json({ success: true, tickets: enrichedTickets });
    } catch (error) {
        console.error('Failed to fetch support tickets', error);
        return NextResponse.json({ success: false, message: 'Eroare la preluarea tichetelor' }, { status: 500 });
    }
}
