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
        const { clientName, clientPhone, address, scheduledDate, scheduledTime, cartItems, clientType, cui, email, internalNotes } = body;

        if (!clientName || !address) {
            return NextResponse.json({ success: false, message: 'Numele clientului și Adresa sunt obligatorii' }, { status: 400 });
        }

        // Form full ISO date if both exist
        let finalIsoDate = new Date().toISOString();
        if (scheduledDate) {
            finalIsoDate = scheduledTime ? `${scheduledDate}T${scheduledTime}:00.000Z` : `${scheduledDate}T00:00:00.000Z`;
        }

        const metadata = {
            source: 'independent_manual',
            scheduledDate: finalIsoDate,
            rawAppointmentDate: finalIsoDate, // Important for UI
            products: cartItems || [], // Unified Cart
            clientType: clientType || 'persoana_fizica',
            email: email || '',
            cui: cui || null,
            internalNotes: internalNotes || null,
            customerNote: internalNotes || null // Fallback mapping
        };

        const title = cartItems?.length > 0 ? cartItems[0].name : 'Lucrare Proprie';

        const newJob = await (prisma as any).job.create({
            data: {
                title: title,
                clientName: clientName,
                clientPhone: clientPhone || '',
                address: address,
                status: 'pending',
                installerId: decoded.userId || decoded.id,
                isManual: true,
                metadata: metadata,
                createdAt: new Date() // REAL creation date
            }
        });

        // Also push a silent notification so the user has an explicit trace
        await (prisma as any).appNotification.create({
            data: {
                installerId: decoded.userId || decoded.id,
                title: 'Șantier Nou Generat',
                message: `Ai creat cu succes șantierul local pentru clientul ${clientName}. Portofoliul tău ClimaticPRO a fost actualizat.`,
                type: 'JOB',
                link: newJob.id.toString(),
                isRead: false
            }
        });

        return NextResponse.json({ success: true, job: newJob });
        
    } catch (error) {
        console.error('Create Manual Job Error:', error);
        return NextResponse.json({ success: false, message: 'Server Error la generarea șantierului' }, { status: 500 });
    }
}
