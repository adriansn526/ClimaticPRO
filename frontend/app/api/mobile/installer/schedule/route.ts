import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const prisma = getPrisma();
        const profile = await prisma.installerProfile.findUnique({
            where: { userId: decoded.userId },
            select: { dailyCapacity: true, unavailableDates: true }
        });

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        let unavailArray = [];
        if (profile.unavailableDates) {
            unavailArray = Array.isArray(profile.unavailableDates) ? profile.unavailableDates : 
                            (typeof profile.unavailableDates === 'string' ? JSON.parse(profile.unavailableDates) : []);
        }

        return NextResponse.json({
            success: true,
            capacity: profile.dailyCapacity || 3,
            unavailableDates: unavailArray
        });
    } catch (e) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const body = await req.json();
        const { capacity, unavailableDates } = body;

        const prisma = getPrisma();
        
        let updateData: any = {};
        if (typeof capacity === 'number' && capacity >= 0) {
            updateData.dailyCapacity = capacity;
        }
        if (Array.isArray(unavailableDates)) {
            updateData.unavailableDates = unavailableDates;
        }

        const profile = await prisma.installerProfile.update({
            where: { userId: decoded.userId },
            data: updateData,
            select: { dailyCapacity: true, unavailableDates: true }
        });

        return NextResponse.json({ success: true, profile });
    } catch (e) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
