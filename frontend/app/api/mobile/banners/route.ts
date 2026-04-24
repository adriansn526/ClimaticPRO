import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic'; // Prevents Next.js from aggressively cashing this mobile proxy route

export async function GET() {
    try {
        const activeBanners = await prisma.appBanner.findMany({
            where: {
                active: true
            },
            orderBy: {
                order: 'asc'
            }
        });

        return NextResponse.json(activeBanners);
    } catch (error: any) {
        return NextResponse.json({ error: 'Nu am putut încărca bannerele' }, { status: 500 });
    }
}
