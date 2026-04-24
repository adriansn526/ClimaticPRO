import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { runScraperTask } from '@/lib/scraperRunner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const prisma = getPrisma();

export async function POST(req: Request) {
  try {
    const { supplierId } = await req.json();

    if (!supplierId) {
      return NextResponse.json({ success: false, message: 'ID Furnizor lipsă.' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(supplierId) }
    });

    if (!supplier || !supplier.crawlerConfig) {
      return NextResponse.json({ success: false, message: 'Furnizorul nu are configurat motorul de Scraping.' }, { status: 400 });
    }

    // 1. Config & Validation
    console.log(`[Scraper API] Pornire motor pe furnizor ID: ${supplier.id}`);
    const config = supplier.crawlerConfig as any;
    
    // Test if valid config
    if (!config.catalogUrls || config.catalogUrls.length === 0 || !config.productLinkSelector) {
        return NextResponse.json({ success: false, message: 'Configurare scraper invalidă (lipsesc selectori).' }, { status: 400 });
    }

    // 2. Crează tracking Job
    const scraperJob = await prisma.scraperJob.create({
        data: {
            supplierId: supplier.id,
            status: 'running',
            progress: 'Pornire proces Chromium Puppeteer...',
            resultStats: { total: 0, autoMapped: 0, unmapped: 0 }
        }
    });

    // 3. Lansează asincron (Fire & Forget)
    runScraperTask(scraperJob.id, supplier, config).catch(e => {
        console.error(`Scraper Task Eroare de captură neprinsă: ${e}`);
    });

    return NextResponse.json({ 
        success: true, 
        message: 'Robotul de crawling a fost pornit în fundal!',
        jobId: scraperJob.id
    });

  } catch (error: any) {
    console.error('[Scraper API] FATAL ERROR:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


