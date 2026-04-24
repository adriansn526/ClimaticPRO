import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

async function downloadImage(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
             headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!res.ok) return null;
        
        const buffer = await res.arrayBuffer();
        
        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const hash = crypto.createHash('md5').update(url + Date.now().toString()).digest('hex');
        
        let ext = '.jpg';
        const contentType = res.headers.get('content-type');
        if (contentType) {
            if (contentType.includes('png')) ext = '.png';
            if (contentType.includes('webp')) ext = '.webp';
        } else {
             const urlParts = url.split('.');
             const extractedExt = urlParts[urlParts.length - 1].toLowerCase().split('?')[0];
             if (['jpg', 'jpeg', 'png', 'webp'].includes(extractedExt)) {
                 ext = '.' + extractedExt;
             }
        }
        
        const filename = `${hash}${ext}`;
        const filePath = path.join(uploadDir, filename);
        
        fs.writeFileSync(filePath, Buffer.from(buffer));
        
        return `/uploads/products/${filename}`;
    } catch (e) {
        console.error("Failed to download image:", e);
        return null;
    }
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + crypto.randomBytes(3).toString('hex');
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { unmappedId, title, price, descriptionHtml, imageUrl, categoryId, attributes } = data;

    if (!unmappedId || !title || !price) {
        return NextResponse.json({ success: false, message: 'Date incomplete.' }, { status: 400 });
    }

    const unmapped = await prisma.unmappedSupplierProduct.findUnique({
      where: { id: unmappedId }
    });

    if (!unmapped) {
      return NextResponse.json({ success: false, message: 'Produsul din carantină nu mai există.' }, { status: 404 });
    }

    let savedImageUrl = null;
    if (imageUrl) {
        // download it securely
        savedImageUrl = await downloadImage(imageUrl);
    }

    // Determine some default unit/stock from quarantine
    const stockQty = unmapped.extractedStock === 'in_stock' ? 100 : 0;

    // Grab supplier default margin
    let defaultMarginValue = 10;
    let defaultMarginType = 'PERCENT';
    if (unmapped.supplierId) {
        const sup = await prisma.supplier.findUnique({ where: { id: unmapped.supplierId }});
        if (sup) {
             defaultMarginValue = sup.defaultMarginValue !== null ? sup.defaultMarginValue : 10;
             defaultMarginType = sup.defaultMarginType || 'PERCENT';
        }
    }

    // Create the B2B Product!
    const newProduct = await prisma.b2BProduct.create({
        data: {
             name: title,
             slug: generateSlug(title),
             description: descriptionHtml,
             priceB2B: price, // Initial import price, repricer will override if mapped
             stock: stockQty,
             unit: "buc",
             image: savedImageUrl,
             wooCategoryIds: categoryId && !isNaN(parseInt(categoryId, 10)) ? [parseInt(categoryId, 10)] : [],
             attributes: Object.keys(attributes || {}).length > 0 ? attributes : undefined,
             active: true,
             marginValue: defaultMarginValue,
             marginType: defaultMarginType
        }
    });

    // Create the ProductSupplier mapped link!
    await prisma.productSupplier.create({
        data: {
            productId: newProduct.id,
            supplierId: unmapped.supplierId,
            supplierProductUrl: unmapped.supplierProductUrl,
            supplierPrice: unmapped.extractedPrice,
            supplierStock: unmapped.extractedStock
        }
    });

    // Remove from unmapped queue
    await prisma.unmappedSupplierProduct.delete({
        where: { id: unmappedId }
    });

    return NextResponse.json({ success: true, message: 'Produs adăugat cu succes.', product: newProduct });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
