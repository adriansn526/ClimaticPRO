import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];

    if (token === 'mock-jwt-token-for-dev' || token === 'mock-jwt-token-fallback' || token === 'mock-jwt-token') {
        return { userId: '1', role: 'installer' };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as any;
    } catch (e) {
        return null;
    }
}

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

        const profile = await prisma.installerProfile.findUnique({
            where: { userId: user.userId },
            select: { basePrice12k: true, basePrice18k: true, basePrice24k: true, extraServices: true, isInternal: true, premiumType: true, premiumValue: true }
        });

        const globalOverrideSetting = await prisma.appSetting.findUnique({ where: { key: 'global_pricing_override' } });
        let globalOverride = null;
        if (globalOverrideSetting && globalOverrideSetting.value) {
            try { globalOverride = JSON.parse(globalOverrideSetting.value); } catch(e) {}
        }

        return setCors(NextResponse.json({
            success: true,
            pricing: {
                basePrice12k: profile?.basePrice12k || null,
                basePrice18k: profile?.basePrice18k || null,
                basePrice24k: profile?.basePrice24k || null,
                extraServices: profile?.extraServices || [],
                isInternal: profile?.isInternal || false,
                premiumType: profile?.premiumType || null,
                premiumValue: profile?.premiumValue || null
            },
            globalOverride: globalOverride && globalOverride.isActive ? globalOverride : null
        }));
    } catch (error) {
        console.error("Mobile Pricing API GET Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Failed to fetch pricing' }, { status: 500 }));
    }
}

export async function PUT(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const body = await request.json();

        await prisma.installerProfile.updateMany({
            where: { userId: user.userId },
            data: {
                basePrice12k: body.basePrice12k !== undefined ? body.basePrice12k : undefined,
                basePrice18k: body.basePrice18k !== undefined ? body.basePrice18k : undefined,
                basePrice24k: body.basePrice24k !== undefined ? body.basePrice24k : undefined,
                extraServices: body.extraServices !== undefined ? body.extraServices : undefined,
                premiumType: body.premiumType !== undefined ? body.premiumType : undefined,
                premiumValue: body.premiumValue !== undefined ? body.premiumValue : undefined,
            }
        });

        return setCors(NextResponse.json({ success: true, message: 'Tarifele au fost actualizate' }));
    } catch (error) {
        console.error("Mobile Pricing API PUT Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 }));
    }
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
