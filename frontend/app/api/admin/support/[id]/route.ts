import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, context: any) {
    try {
        const { params } = context;
        const ticketId = Number(params.id);

        if (isNaN(ticketId)) return NextResponse.json({ success: false, message: 'ID invalid' }, { status: 400 });

        const body = await request.json();
        const { status } = body;
        
        if (!['OPEN', 'RESOLVED'].includes(status)) {
            return NextResponse.json({ success: false, message: 'Status invalid' }, { status: 400 });
        }

        const prisma = getPrisma();
        
        const updated = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status }
        });

        return NextResponse.json({ success: true, ticket: updated, message: 'Tichet marcat cu succes!' });
    } catch (error) {
        console.error('Error updating support ticket:', error);
        return NextResponse.json({ success: false, message: 'Eroare la actualizare' }, { status: 500 });
    }
}
