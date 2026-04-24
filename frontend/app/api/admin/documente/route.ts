import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const prisma = getPrisma();
    try {
        const orders = await prisma.b2BOrder.findMany({
            where: {
                documentUrls: { not: null }
            },
            include: {
                installerProfile: {
                    select: { companyName: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Flatten the data into individual documents
        const documents: any[] = [];
        for (const order of orders) {
            const urls = Array.isArray((order as any).documentUrls) ? ((order as any).documentUrls as string[]) : [];
            urls.forEach((url) => {
                const isProforma = url.includes('Proforma');
                documents.push({
                    orderId: order.id,
                    type: isProforma ? 'Proformă B2B' : 'Factură Fiscală B2B',
                    url: url,
                    date: order.createdAt,
                    customer: (order as any).installerProfile?.companyName || (order as any).installerProfile?.name || 'Client',
                    amount: order.totalAmount
                });
            });
        }

        return NextResponse.json({ success: true, documents });
    } catch (error) {
        console.error('Documents Fetch Error:', error);
        return NextResponse.json({ success: false, message: 'Nu s-au putut prelua documentele' }, { status: 500 });
    }
}
