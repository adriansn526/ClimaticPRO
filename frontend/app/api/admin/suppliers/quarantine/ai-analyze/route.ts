import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { normalizeQuarantineProduct } from '@/lib/ai-supply';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { unmappedId } = body;

        if (!unmappedId) {
            return NextResponse.json({ success: false, message: 'unmappedId este obligatoriu' }, { status: 400 });
        }

        // Fetch the raw product
        const unmapped = await (prisma as any).unmappedSupplierProduct.findUnique({
            where: { id: unmappedId },
            include: { supplier: true }
        });

        if (!unmapped) {
            return NextResponse.json({ success: false, message: 'Produsul nu există în carantină' }, { status: 404 });
        }

        // We run the AI Copilot on it
        const aiResult = await normalizeQuarantineProduct({
            extractedName: unmapped.extractedName,
            extractedPrice: unmapped.extractedPrice,
            descriptionHtml: '', // Normally we would run deep-scrape to get description, but we rely on Name for instant AI
            supplierName: unmapped.supplier.name
        });

        if (!aiResult.success) {
            return NextResponse.json({ success: false, message: aiResult.message }, { status: 500 });
        }

        // Return the clean data to the UI!
        return NextResponse.json({ 
            success: true, 
            message: 'Inference successful',
            originalName: unmapped.extractedName,
            originalPrice: unmapped.extractedPrice,
            ai: aiResult.data 
        });

    } catch (error: any) {
        console.error('AI Suggestion Endpoint Error:', error);
        return NextResponse.json({ success: false, message: 'Server error la procesarea analitică' }, { status: 500 });
    }
}
