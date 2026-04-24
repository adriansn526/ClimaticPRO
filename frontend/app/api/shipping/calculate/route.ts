import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { hardwareUnits, county, hasInstallation } = body;
        
        let units = parseInt(hardwareUnits) || 0;
        if (units === 0) return NextResponse.json({ success: true, shippingCost: 0, text: 'Nu este necesar transport hardware.' });
        if (!county) return NextResponse.json({ success: true, shippingCost: units * 120, text: 'Calculat la tarif standard (fără destinație specificată).' });

        const prisma = getPrisma();
        
        // Find best match in DB
        const searchCounty = String(county).toLowerCase().trim().replace('ș', 's').replace('ț', 't');
        
        // @ts-ignore
        const allRules = await prisma.shippingZoneRule.findMany({ where: { active: true } });
        
        let matchedRule = allRules.find((r: any) => r.countyCode.toLowerCase().trim() === searchCounty);
        // try without diacritics fuzzy
        if (!matchedRule) {
            matchedRule = allRules.find((r: any) => {
                const rClean = r.countyCode.toLowerCase().trim().replace('ș', 's').replace('ț', 't');
                return rClean === searchCounty || searchCounty.includes(rClean) || rClean.includes(searchCounty);
            });
        }

        if (matchedRule) {
            // Apply rule
            if (matchedRule.waiveShippingIfInstalled && hasInstallation) {
                return NextResponse.json({ 
                    success: true, 
                    shippingCost: 0, 
                    text: `Transport Gratuit în ${matchedRule.countyCode} la achiziția cu montaj!`,
                    ruleMatched: matchedRule 
                });
            }
            return NextResponse.json({
                success: true,
                shippingCost: units * matchedRule.standardShippingFee,
                text: `Taxă de livrare pentru ${matchedRule.countyCode}.`,
                ruleMatched: matchedRule
            });
        }

        // Default Fallback
        return NextResponse.json({ 
            success: true, 
            shippingCost: units * 120, 
            text: 'Tarif standard național.' 
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
