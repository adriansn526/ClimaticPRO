import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-keep-safe-in-prod';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch {
        return null;
    }
}

export async function PUT(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });

        const { companyName } = await request.json();

        const profile = await prisma.installerProfile.upsert({
            where: { userId: user.userId },
            update: { companyName },
            create: { userId: user.userId, companyName }
        });

        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error("Team Admin Name Update Error:", error);
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
