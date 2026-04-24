import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Mock Token verification logic (similar to other mobile endpoints)
function verifyToken(request: Request) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    if (token === 'mock-jwt-token-for-dev' || token === 'mock-jwt-token-fallback' || token === 'mock-jwt-token') {
        return {
            id: 1,
            userId: '1',
            name: 'Instalator Profil Test',
            phone: '0722222222',
            role: 'installer'
        };
    }

    return null;
}

const prisma = new PrismaClient();

// Helper to add CORS to responses
const setCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

// GET: Fetch current invoicing config
export async function GET(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const profile = await prisma.installerProfile.findUnique({
            where: { userId: user.id.toString() }
        });

        if (!profile) {
            return setCors(NextResponse.json({ success: false, message: 'Profil negăsit' }, { status: 404 }));
        }

        return setCors(NextResponse.json({
            success: true,
            billingProvider: profile.billingProvider,
            billingToken: profile.billingToken,
            billingSeries: profile.billingSeries,
            spvToken: profile.spvToken
        }));
    } catch (error) {
        console.error('Fetch Invoicing Config Error:', error);
        return setCors(NextResponse.json({ success: false, message: 'Eroare la preluare config facturare' }, { status: 500 }));
    }
}

// POST: Update invoicing config
export async function POST(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const { billingProvider, billingToken, billingSeries, spvToken } = await request.json();

        const updatedProfile = await prisma.installerProfile.upsert({
            where: { userId: user.id.toString() },
            create: {
                userId: user.id.toString(),
                billingProvider,
                billingToken,
                billingSeries,
                spvToken
            },
            update: {
                billingProvider,
                billingToken,
                billingSeries,
                spvToken
            }
        });

        return setCors(NextResponse.json({
            success: true,
            message: 'Setări facturare salvate cu succes.'
        }));

    } catch (error) {
        console.error('Update Invoicing Config Error:', error);
        return setCors(NextResponse.json({ success: false, message: 'Eroare la salvare setări' }, { status: 500 }));
    }
}

export async function OPTIONS() {
    return setCors(new NextResponse(null, { status: 200 }));
}
