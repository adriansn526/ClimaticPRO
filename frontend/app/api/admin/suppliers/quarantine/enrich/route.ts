import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { productId, url } = await req.json();
        if (!productId || !url) {
            return NextResponse.json({ success: false, message: 'Missing product ID or URL.' });
        }

        const { enrichProductWithScraper } = await import('@/lib/scraper');
        
        console.log(`[Golden PIM] Starting enrichment for Product ID ${productId} from URL ${url}...`);
        const { description, imageUrl } = await enrichProductWithScraper(url);

        let localImagePath = null;

        if (imageUrl) {
            console.log(`[Golden PIM] Found image at ${imageUrl}, downloading...`);
            try {
                const imgRes = await fetch(imageUrl);
                if (imgRes.ok) {
                    const arrayBuffer = await imgRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    const fileName = `enriched_${productId}_${Date.now()}.jpg`;
                    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
                    
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(filePath, buffer);
                    localImagePath = `/uploads/products/${fileName}`;
                    console.log(`[Golden PIM] Saved image to ${localImagePath}`);
                }
            } catch(downloadErr) {
                console.error("[Golden PIM] Failed downloading image:", downloadErr);
            }
        }

        const prisma = getPrisma();
        
        const updateData: any = {};
        if (description) updateData.description = description;
        if (localImagePath) updateData.image = localImagePath;

        if (Object.keys(updateData).length > 0) {
             await prisma.b2BProduct.update({
                 where: { id: parseInt(productId) },
                 data: updateData
             });
             console.log(`[Golden PIM] Successfully enriched B2BProduct ${productId}`);
        } else {
             console.log(`[Golden PIM] Nothing extracted string enough to enrich B2BProduct ${productId}`);
        }

        return NextResponse.json({ success: true, enriched: Object.keys(updateData).length > 0 });
    } catch(err) {
        console.error('[Golden PIM] Enrich Route Error', err);
        return NextResponse.json({ success: false, message: 'Internal Error' }, { status: 500 });
    }
}
