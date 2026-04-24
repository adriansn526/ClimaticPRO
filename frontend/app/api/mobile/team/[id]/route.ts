import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

// Helper to verify JWT from headers
function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as any;
    } catch (e) {
        return null;
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }

        const memberId = parseInt(params.id);
        if (isNaN(memberId)) {
            return NextResponse.json({ success: false, message: 'ID invalid' }, { status: 400 });
        }

        const member = await prisma.teamMember.findUnique({
            where: { id: memberId }
        });

        if (!member || member.installerId !== user.userId) {
            return NextResponse.json({ success: false, message: 'Membru inexistent sau neautorizat' }, { status: 404 });
        }

        await prisma.teamMember.delete({
            where: { id: memberId }
        });

        return NextResponse.json({ success: true, message: 'Acces eliminat' });

    } catch (error) {
        console.error("Mobile Team DELETE API Error:", error);
        return NextResponse.json({ success: false, error: 'Eroare server' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }

        const memberId = parseInt(params.id);
        if (isNaN(memberId)) {
            return NextResponse.json({ success: false, message: 'ID invalid' }, { status: 400 });
        }

        const body = await request.json();
        const { action, name, role } = body; // action can be 'edit' or 'resend'

        const member = await prisma.teamMember.findUnique({
            where: { id: memberId }
        });

        if (!member || member.installerId !== user.userId) {
            return NextResponse.json({ success: false, message: 'Membru inexistent sau neautorizat' }, { status: 404 });
        }

        if (action === 'resend') {
            if (member.status !== 'pending') {
                return NextResponse.json({ success: false, message: 'Membru este deja activ, nu se poate retrimite.' }, { status: 400 });
            }

            // Fetch Installer Details for SMS Context
            const installer = await prisma.installerProfile.findUnique({
                where: { userId: user.userId }
            });
            const installerName = installer?.companyName || 'un instalator partener';

            const SMSO_API_KEY = process.env.SMSO_API_KEY || '6iABkheApb8L6a0bpJY2amhCYPD5Bo9zu9a4EuHj';
            const SMSO_SENDER_ID = process.env.SMSO_SENDER_ID || '';
            const formData = new URLSearchParams();
            formData.append('to', member.phone);
            formData.append('body', `Ai fost invitat (din nou) în echipa ${installerName} pe ClimaticPRO. Descarcă aplicația pentru a accepta: https://climaticpro.ro/pentru-instalatori`);
            formData.append('sender', SMSO_SENDER_ID || '4');

            try {
                await fetch('https://app.smso.ro/api/v1/send', {
                    method: 'POST',
                    headers: {
                        'X-Authorization': SMSO_API_KEY,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData.toString()
                });
            } catch (smsError) {
                console.error("Mobile Team SMS Dispatch Error (Resend):", smsError);
            }

            return NextResponse.json({ success: true, message: 'Invitație retrimisă cu succes' });
        }

        if (action === 'edit') {
            const updatedMember = await prisma.teamMember.update({
                where: { id: memberId },
                data: {
                    ...(name && { name }),
                    ...(role && { role })
                }
            });
            return NextResponse.json({ success: true, member: updatedMember });
        }

        return NextResponse.json({ success: false, message: 'Acțiune invalidă' }, { status: 400 });

    } catch (error) {
        console.error("Mobile Team PUT API Error:", error);
        return NextResponse.json({ success: false, error: 'Eroare server' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
