import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function GET() {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { key: 'global_pricing_override' }
        });

        let data: any = { 
            isActive: false, 
            isMaintenanceActive: false,
            basePrice12k: 950, 
            basePrice18k: 1100, 
            basePrice24k: 1200, 
            extraServices: [], 
            maintenancePrice: 150, 
            premiumMarginType: 'fixed',
            premiumMarginValue: 140,
            repairPrice: 100 
        };
        
        if (setting && setting.value) {
            try {
                const parsed = JSON.parse(setting.value);
                data = { ...data, ...parsed };
                if (typeof parsed.isMaintenanceActive === 'undefined') {
                    data.isMaintenanceActive = data.isActive; // Fallback to old behavior
                }
            } catch (e) { }
        }

        let calcPremium = Number(data.maintenancePrice) || 150;
        if (data.premiumMarginType === 'percent') {
            calcPremium = calcPremium + Math.round((calcPremium * Number(data.premiumMarginValue || 0)) / 100);
        } else {
            calcPremium = calcPremium + Number(data.premiumMarginValue || 140);
        }
        data.maintenancePremiumPrice = calcPremium;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        
        await prisma.appSetting.upsert({
            where: { key: 'global_pricing_override' },
            update: { value: JSON.stringify(body) },
            create: { key: 'global_pricing_override', value: JSON.stringify(body) }
        });

        return NextResponse.json({ success: true, message: 'Setările au fost salvate' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
