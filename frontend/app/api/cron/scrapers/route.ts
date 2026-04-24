import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { runScraperTask } from '@/lib/scraperRunner';
import { Prisma } from '@prisma/client';

const prisma = getPrisma();
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-123';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[CRON-SCRAPER] Pinging queue...');

        // 1. Check Global Cron Setting
        const setting = await prisma.appSetting.findUnique({
            where: { key: 'scraper_cron_enabled' }
        });
        if (!setting || setting.value !== 'true') {
            console.log('[CRON-SCRAPER] Global switch is OFF. Aborting.');
            return NextResponse.json({ success: true, message: 'Cron is globally disabled in UI.' });
        }

        // 2. Cleanup Zombie Jobs (Running for over 45 minutes)
        const staleDate = new Date();
        staleDate.setMinutes(staleDate.getMinutes() - 45);

        const staleCleaned = await prisma.scraperJob.updateMany({
            where: { 
                 status: 'running',
                 createdAt: { lt: staleDate }
            },
            data: {
                 status: 'failed',
                 progress: 'Eșuat automat: Depășit timpul limită de 45 de minute (Posibil blocat pe pagina furnizorului).'
            }
        });

        if (staleCleaned.count > 0) {
            console.log(`[CRON-SCRAPER] Curățat ${staleCleaned.count} zombie jobs.`);
        }

        // 3. Check for active running Scraper Jobs
        // We do not want to overlap scrapers, to preserve RAM and DB concurrency.
        const runningJobs = await prisma.scraperJob.count({
            where: { status: 'running' }
        });

        if (runningJobs > 0) {
            console.log('[CRON-SCRAPER] A scraper is currently running. Skipping tick to prevent overlap.');
            return NextResponse.json({ success: true, message: 'A scraper is currently running. Skipped.' });
        }

        // 3. Find next supplier (oldest last-scraped)
        const suppliers = await prisma.supplier.findMany({
            where: { 
                active: true,
                autoSync: true,
                crawlerConfig: { not: Prisma.DbNull }
            },
            include: {
                scraperJobs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (suppliers.length === 0) {
            return NextResponse.json({ success: true, message: 'No eligible suppliers for auto-sync.' });
        }

        // Sort: Suppliers with NO jobs first, then by oldest job
        suppliers.sort((a: any, b: any) => {
            const aJobs = a.scraperJobs || [];
            const bJobs = b.scraperJobs || [];
            if (aJobs.length === 0 && bJobs.length > 0) return -1;
            if (aJobs.length > 0 && bJobs.length === 0) return 1;
            if (aJobs.length === 0 && bJobs.length === 0) return 0;
            return new Date(aJobs[0].createdAt).getTime() - new Date(bJobs[0].createdAt).getTime();
        });

        const targetSupplier = suppliers[0];
        const config = targetSupplier.crawlerConfig as any;

        // Ensure config is valid
        if (!config || !config.catalogUrls || config.catalogUrls.length === 0) {
            return NextResponse.json({ success: false, message: 'Supplier missing config. Skipped.' });
        }

        // 4. Create Job and Fire off scraper
        const newJob = await prisma.scraperJob.create({
            data: {
                supplierId: targetSupplier.id,
                status: 'running',
                progress: 'Lansare automată (CRON): Inițializare crawler...',
                resultStats: { total: 0, unmapped: 0, autoMapped: 0 }
            }
        });

        console.log(`[CRON-SCRAPER] Automatically triggering Scrape for Supplier ID: ${targetSupplier.id} (${targetSupplier.name})`);
        
        // Fire & Forget Process
        runScraperTask(newJob.id, targetSupplier, config).catch((e) => {
            console.error(`[CRON-SCRAPER] Fatal background error for job ${newJob.id}:`, e);
        });

        return NextResponse.json({ 
            success: true, 
            message: `Triggered auto-sync for ${targetSupplier.name}`,
            jobId: newJob.id
        });

    } catch (error) {
        console.error('[CRON-SCRAPER] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
