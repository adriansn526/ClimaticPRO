import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
    const prisma = getPrisma();
    try {
        const settings = await prisma.appSetting.findMany();
        
        // Convert array to key-value object
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json({ success: true, settings: settingsMap });
    } catch (error) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la preluarea setărilor.' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const prisma = getPrisma();
    try {
        const body = await request.json();
        const settingsToUpdate = body.settings as Record<string, string>;

        if (!settingsToUpdate || typeof settingsToUpdate !== 'object') {
             return NextResponse.json({ success: false, message: 'Invalid settings payload.' }, { status: 400 });
        }

        // We use Prisma transactions to upsert all keys
        const updatePromises = Object.entries(settingsToUpdate).map(([key, value]) => {
            return prisma.appSetting.upsert({
                where: { key: key },
                update: { value: value?.toString() || '' },
                create: { key: key, value: value?.toString() || '' }
            });
        });

        await prisma.$transaction(updatePromises);

        return NextResponse.json({ success: true, message: 'Setările au fost salvate cu succes!' });
    } catch (error) {
        console.error('Settings PUT Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la salvarea setărilor.' }, { status: 500 });
    }
}
