import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const prisma = getPrisma();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ success: false, message: 'Missing jobId' }, { status: 400 });
        }

        const job = await prisma.scraperJob.findUnique({
            where: { id: parseInt(jobId) }
        });

        if (!job) {
            return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            job
        });

    } catch (error: any) {
        console.error('[Scraper Status API] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
