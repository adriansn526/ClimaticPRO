import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await prisma.appSetting.findMany({
            where: {
                key: { in: ['scraper_cron_enabled', 'scraper_cron_time', 'scraper_cron_frequency'] }
            }
        });
        
        const isEnabled = settings.find(s => s.key === 'scraper_cron_enabled')?.value === 'true';
        const cronTime = settings.find(s => s.key === 'scraper_cron_time')?.value || '04:00';
        const cronFrequency = settings.find(s => s.key === 'scraper_cron_frequency')?.value || '24';

        return NextResponse.json({ success: true, enabled: isEnabled, cronTime, cronFrequency: parseInt(cronFrequency) });
    } catch (error) {
        console.error("Error fetching cron setting:", error);
        return NextResponse.json({ success: false, error: 'Eroare la obținerea setării' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { enabled, cronTime, cronFrequency } = body;
        
        if (typeof enabled !== 'undefined') {
            await prisma.appSetting.upsert({
                where: { key: 'scraper_cron_enabled' },
                update: { value: enabled ? 'true' : 'false' },
                create: { key: 'scraper_cron_enabled', value: enabled ? 'true' : 'false' }
            });
        }
        
        if (typeof cronTime !== 'undefined') {
             await prisma.appSetting.upsert({
                where: { key: 'scraper_cron_time' },
                update: { value: cronTime.toString() },
                create: { key: 'scraper_cron_time', value: cronTime.toString() }
            });
        }

        if (typeof cronFrequency !== 'undefined') {
             await prisma.appSetting.upsert({
                where: { key: 'scraper_cron_frequency' },
                update: { value: cronFrequency.toString() },
                create: { key: 'scraper_cron_frequency', value: cronFrequency.toString() }
            });
        }

        return NextResponse.json({ success: true, enabled, cronTime, cronFrequency });
    } catch (error) {
        console.error("Error updating cron setting:", error);
        return NextResponse.json({ success: false, error: 'Eroare la modificarea setării' }, { status: 500 });
    }
}
