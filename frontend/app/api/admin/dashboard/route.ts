import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getWooCommerceOrders } from '@/lib/woo-admin';

const prisma = getPrisma();

export async function GET(request: Request) {
    try {
        // 1. Total B2B Sales
        const b2bOrders = await prisma.b2BOrder.findMany({
            where: {
                status: {
                    not: 'canceled'
                }
            },
            select: { totalAmount: true }
        });
        const totalB2BSales = b2bOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

        // 2. Active Installers
        const activeInstallersCount = await prisma.installerProfile.count({
            where: { status: 'approved' }
        });

        const pendingInstallersCount = await prisma.installerProfile.count({
            where: { status: 'pending' }
        });

        // 3. Latest Activity (Last 5 B2B Orders)
        const latestB2B = await prisma.b2BOrder.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        // Manual profile fetching since there's no defined Prisma relation
        const installerIds = [...new Set(latestB2B.map(o => o.installerId))];
        const profiles = await prisma.installerProfile.findMany({
            where: { userId: { in: installerIds } },
            select: { userId: true, name: true, companyName: true }
        });
        
        const profileMap: Record<string, any> = {};
        profiles.forEach(p => {
            profileMap[p.userId] = p;
        });

        // Format activity
        const activity = latestB2B.map(b => ({
            id: b.id,
            type: 'b2b_order',
            title: `Comandă B2B Nouă: ${b.totalAmount} RON`,
            subtitle: profileMap[b.installerId]?.companyName || b.authorName || 'Instalator',
            date: b.createdAt
        }));

        // We can optionally fetch WooCommerce orders here, but since the Admin page
        // already fetches WooCommerce orders efficiently via its own hook, we'll
        // combine stats on the frontend to avoid double API calls to Woo REST.

        return NextResponse.json({
            success: true,
            totalB2BSales,
            activeInstallersCount,
            pendingInstallersCount,
            latestB2BOrders: activity
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ success: false, error: 'Eroare la generarea statisticilor' }, { status: 500 });
    }
}
