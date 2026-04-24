import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { sendGenericEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }
        
        const installerId = user.userId || user.id;
        const body = await request.json();
        
        const { category, message } = body;
        
        if (!category || !message || message.trim().length === 0) {
            return NextResponse.json({ success: false, message: 'Selectează o categorie și scrie un mesaj valid.' }, { status: 400 });
        }

        const prisma = getPrisma();

        // Salvare în baza de date
        const ticket = await prisma.supportTicket.create({
            data: {
                installerId,
                category,
                message,
                status: 'OPEN'
            }
        });

        // Preiau datele instalatorului pentru vizualizare pe email
        const profile = await prisma.installerProfile.findUnique({
            where: { userId: installerId }
        });

        const installerName = profile?.name || profile?.companyName || 'Instalator Necunoscut';
        const installerPhone = profile?.phone || 'Telefon indisponibil';
        const installerEmail = profile?.email || 'Email indisponibil';

        // Trimitere email către administrator
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0891b2;">Tichet Nou Suport (App Mobile)</h2>
                <p><strong>De la:</strong> ${installerName} (${installerEmail} / ${installerPhone})</p>
                <p><strong>Subiect:</strong> ${category}</p>
                <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #0891b2; margin-top: 15px;">
                    <p style="white-space: pre-wrap; margin: 0;">${message}</p>
                </div>
                <p style="margin-top: 20px; font-size: 13px; color: #666;">
                    Acest tichet a fost parcat în panoul web de administrare sub ID #${ticket.id}.
                </p>
            </div>
        `;

        await sendGenericEmail({
            to: 'contact@climaticpro.ro',
            subject: `Tichet Nou App: ${category} - ${installerName}`,
            html: emailHtml,
            replyTo: profile?.email || 'contact@climaticpro.ro'
        });

        return NextResponse.json({ success: true, message: 'Tichetul a fost deschis cu succes.', ticketId: ticket.id });

    } catch (error) {
        console.error('Support Ticket Creation Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă. Verifică logurile.' }, { status: 500 });
    }
}
