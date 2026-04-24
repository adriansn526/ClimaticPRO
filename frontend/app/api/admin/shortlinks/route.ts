import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export async function GET() {
    try {

        const links = await prisma.shortLink.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, links });
    } catch (e) {
        console.error("GET Shortlinks error:", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { shortCode, targetUrl } = await req.json();

        if (!shortCode || !targetUrl) {
            return NextResponse.json({ error: 'Codul scurt și URL-ul țintă sunt obligatorii.' }, { status: 400 });
        }

        // Validate code pattern (alphanumeric, dashes, underscores)
        if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
            return NextResponse.json({ error: 'Codul scurt poate conține doar litere, cifre, liniuțe și underscore-uri.' }, { status: 400 });
        }

        try {
            const newLink = await prisma.shortLink.create({
                data: {
                    shortCode,
                    targetUrl
                }
            });

            return NextResponse.json({ success: true, link: newLink });
        } catch (dbErr: any) {
            if (dbErr.code === 'P2002') {
                 return NextResponse.json({ error: 'Acest cod scurt este deja folosit. Alege un alt cod.' }, { status: 400 });
            }
            throw dbErr;
        }

    } catch (e) {
        console.error("POST Shortlinks error:", e);
        return NextResponse.json({ error: 'Eroare internă de server.' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID obligatoriu.' }, { status: 400 });
        }

        await prisma.shortLink.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("DELETE Shortlinks error:", e);
        return NextResponse.json({ error: 'Eroare internă de server.' }, { status: 500 });
    }
}
