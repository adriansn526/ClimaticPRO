import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { runDeepScrape } from '@/lib/deepScraper';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function POST(req: Request) {
  try {
    const { unmappedId } = await req.json();

    const unmapped = await prisma.unmappedSupplierProduct.findUnique({
      where: { id: unmappedId },
      include: { supplier: true }
    });

    if (!unmapped) {
      return NextResponse.json({ success: false, message: 'Produsul nu a fost găsit în carantină.' }, { status: 404 });
    }

    const config = typeof unmapped.supplier.crawlerConfig === 'object' && unmapped.supplier.crawlerConfig !== null 
                     ? (unmapped.supplier.crawlerConfig as any) : {};

    // Run puppeteer deep scrape
    const scrapedData = await runDeepScrape(unmapped.supplierProductUrl, config);
    
    // Auto-map category if it exists in Dictionary
    let recommendedCategoryId: number | null = null;
    let recommendedCategoryName: string | null = null;
    
    if (scrapedData.categoryText) {
        const mapRules = await prisma.supplierCategoryMap.findFirst({
            where: { 
                supplierId: unmapped.supplier.id,
                supplierCategoryName: scrapedData.categoryText
            },
            include: { category: true }
        });
        
        if (mapRules) {
            recommendedCategoryId = mapRules.internalCategoryId;
            recommendedCategoryName = mapRules.category.name;
        }
    }

    // Default to extracted price if deep scraper couldn't find a price block
    if (!scrapedData.price) {
        scrapedData.price = unmapped.extractedPrice;
    }
    
    // Default to extracted name if deep scraper failed
    if (!scrapedData.title) {
        scrapedData.title = unmapped.extractedName;
    }

    return NextResponse.json({ 
        success: true, 
        data: {
            ...scrapedData,
            recommendedCategoryId,
            recommendedCategoryName
        }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
