import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-keep-safe-in-prod';
const SMSO_API_KEY = process.env.SMSO_API_KEY || '6iABkheApb8L6a0bpJY2amhCYPD5Bo9zu9a4EuHj';
const SMSO_SENDER_ID = process.env.SMSO_SENDER_ID || '';

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

// Helper to add CORS to responses
const setCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

export async function GET(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const team = await prisma.teamMember.findMany({
            where: { installerId: user.userId },
            orderBy: { createdAt: 'asc' }
        });

        return setCors(NextResponse.json({ success: true, team }));
    } catch (error) {
        console.error("Mobile Team GET API Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Eroare server' }, { status: 500 }));
    }
}

export async function POST(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const body = await request.json();
        const { phone, role, name } = body;

        if (!phone || !role) {
            return setCors(NextResponse.json({ success: false, message: 'Date incomplete' }, { status: 400 }));
        }

        // Curățăm numărul de telefon, permițând semnul + pentru E.164
        let cleanPhone = phone.replace(/[^0-9+]/g, '');
        // Dacă nu are cod de țară, adăugăm +40 implicit (sau ajustăm dacă e deja trunchiat)
        if (!cleanPhone.startsWith('+')) {
            if (cleanPhone.startsWith('40') && cleanPhone.length === 11) {
                cleanPhone = '+' + cleanPhone;
            } else if (cleanPhone.startsWith('0')) {
                cleanPhone = '+40' + cleanPhone.substring(1);
            }
        }

        const existingMember = await prisma.teamMember.findUnique({
            where: {
                installerId_phone: {
                    installerId: user.userId,
                    phone: cleanPhone
                }
            }
        });

        if (existingMember) {
            return setCors(NextResponse.json({ success: false, message: 'Acest număr de telefon este deja în echipa ta' }, { status: 400 }));
        }

        const newMember = await prisma.teamMember.create({
            data: {
                installerId: user.userId,
                name: name || cleanPhone,
                phone: cleanPhone,
                role,
                status: 'pending'
            }
        });

        // Fetch Installer Details for the SMS Context
        const installer = await prisma.installerProfile.findUnique({
            where: { userId: user.userId }
        });
        const installerName = installer?.companyName || 'un instalator partener';

        // Send SMS Invitation using SMSO
        const formData = new URLSearchParams();
        formData.append('to', cleanPhone);
        formData.append('body', `Ai fost invitat în echipa ${installerName} pe ClimaticPRO. Descarcă aplicația pentru a accepta invitația: https://climaticpro.ro/pentru-instalatori`);
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
            console.error("Mobile Team SMS Dispatch Error:", smsError);
        }

        return setCors(NextResponse.json({ success: true, member: newMember }));
    } catch (error) {
        console.error("Mobile Team POST API Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Eroare server' }, { status: 500 }));
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
