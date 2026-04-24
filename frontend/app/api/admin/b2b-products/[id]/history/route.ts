import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, message: 'ID Invalid' }, { status: 400 });
        }

        const prisma = getPrisma();
        
        const productSuppliers = await prisma.productSupplier.findMany({
            where: { productId: id },
            include: { 
                supplier: true,
                priceHistory: {
                    orderBy: { recordedAt: 'asc' }
                }
            }
        });

        const formatted: Array<{ date: string, supplierName: string, newPrice: number }> = [];

        for (const ps of productSuppliers) {
             const suppName = ps.supplier.name;
             
             // Extract T0 (Initial Price)  
             const t0Price = ps.priceHistory.length > 0 ? ps.priceHistory[0].oldPrice : ps.supplierPrice;
             
             formatted.push({
                  date: 'T0 (Inițial)',
                  supplierName: suppName,
                  newPrice: t0Price
             });

             // Group all history records by day, keeping the LAST price of each day
             const dailyLastPrice = new Map<string, { price: number, date: Date }>();
             for (const hr of ps.priceHistory) {
                  const dayKey = hr.recordedAt.toISOString().split('T')[0];
                  dailyLastPrice.set(dayKey, { price: hr.newPrice, date: hr.recordedAt });
             }

             // Only add a point when the day's final price DIFFERS from the previous day
             let prevDayPrice = t0Price;
             const sortedDays = Array.from(dailyLastPrice.entries()).sort((a, b) => a[0].localeCompare(b[0]));
             
             for (const [day, { price }] of sortedDays) {
                  if (Math.abs(price - prevDayPrice) > 1) {
                       formatted.push({
                           date: day,
                           supplierName: suppName,
                           newPrice: price
                       });
                  }
                  prevDayPrice = price;
             }

             // Append current price as 'Today' endpoint only if different from last known price
             const todayKey = new Date().toISOString().split('T')[0];
             if (Math.abs(ps.supplierPrice - prevDayPrice) > 1) {
                  formatted.push({
                       date: todayKey,
                       supplierName: suppName,
                       newPrice: ps.supplierPrice
                  });
             }
        }

        // We sort by date, keeping 'T0' at the start
        formatted.sort((a, b) => {
            if (a.date === 'T0 (Inițial)') return -1;
            if (b.date === 'T0 (Inițial)') return 1;
            return a.date.localeCompare(b.date);
        });

        return NextResponse.json({ success: true, history: formatted });

    } catch (err) {
        console.error('History fetch error', err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
