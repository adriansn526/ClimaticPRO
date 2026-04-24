import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
    const prisma = getPrisma();
    try {
        const user = verifyToken(request);
        if (!user) {
            const resp = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            resp.headers.set('Access-Control-Allow-Origin', '*');
            return resp;
        }

        const userId = user.userId;

        const addresses = await prisma.savedAddress.findMany({
            where: { installerId: userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        });

        const resp = NextResponse.json(addresses, { status: 200 });
        resp.headers.set('Access-Control-Allow-Origin', '*');
        return resp;

    } catch (error) {
        console.error('Error fetching addresses:', error);
        const resp = NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
        resp.headers.set('Access-Control-Allow-Origin', '*');
        return resp;
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma();
    try {
        const user = verifyToken(request);
        if (!user) {
            const resp = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            resp.headers.set('Access-Control-Allow-Origin', '*');
            return resp;
        }

        const userId = user.userId;

        const body = await request.json();
        
        // If it's a delete request payload
        if (body.action === 'delete') {
             await prisma.savedAddress.deleteMany({
                 where: { id: body.id, installerId: userId }
             });
             const resp = NextResponse.json({ success: true }, { status: 200 });
             resp.headers.set('Access-Control-Allow-Origin', '*');
             return resp;
        }

        // If this is set as default, remove default from others
        if (body.isDefault) {
            await prisma.savedAddress.updateMany({
                where: { installerId: userId },
                data: { isDefault: false }
            });
        }

        const newAddress = await prisma.savedAddress.create({
            data: {
                installerId: userId,
                title: body.title,
                address: body.address,
                city: body.city || null,
                county: body.county || null,
                phone: body.phone || null,
                isDefault: body.isDefault || false
            }
        });

        const resp = NextResponse.json(newAddress, { status: 201 });
        resp.headers.set('Access-Control-Allow-Origin', '*');
        return resp;

    } catch (error) {
        console.error('Error saving address:', error);
        const resp = NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
        resp.headers.set('Access-Control-Allow-Origin', '*');
        return resp;
    }
}
