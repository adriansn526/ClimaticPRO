import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const banners = await prisma.appBanner.findMany({
            orderBy: { order: 'asc' },
        });
        return NextResponse.json(banners);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { title, imageUrl, linkUrl, active, order } = await req.json();

        if (!title || !imageUrl) {
            return NextResponse.json({ error: 'Titlul și URL-ul imaginii sunt obligatorii' }, { status: 400 });
        }

        const newBanner = await prisma.appBanner.create({
            data: {
                title,
                imageUrl,
                linkUrl: linkUrl || null,
                active: active ?? true,
                order: order || 0,
            },
        });
        return NextResponse.json(newBanner);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, title, imageUrl, linkUrl, active, order } = await req.json();

        if (!id) return NextResponse.json({ error: 'ID Banner lipsă' }, { status: 400 });

        const updatedBanner = await prisma.appBanner.update({
            where: { id: Number(id) },
            data: { title, imageUrl, linkUrl, active, order }
        });
        return NextResponse.json(updatedBanner);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        // Obținem id-ul din query string url
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 });

        await prisma.appBanner.delete({
            where: { id: Number(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
