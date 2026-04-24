import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const prisma = getPrisma();

export async function GET() {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { key: 'global_pricing_override' }
        });

        let globalOverride = null;
        if (setting && setting.value) {
            try { globalOverride = JSON.parse(setting.value); } catch (e) { }
        }

        if (globalOverride && globalOverride.isActive) {
            return NextResponse.json({
                success: true,
                mode: 'fixed',
                price12k: globalOverride.basePrice12k || 950,
                price18k: globalOverride.basePrice18k || 1100,
                price24k: globalOverride.basePrice24k || 1200,
                extraServices: globalOverride.extraServices || []
            });
        }

        // Marketplace mode: Calculate minimums
        const installers = await prisma.installerProfile.findMany({
            where: { status: 'approved', basePrice12k: { not: null } },
            select: { basePrice12k: true, basePrice18k: true, basePrice24k: true, extraServices: true }
        });

        if (installers.length === 0) {
            return NextResponse.json({
                success: true,
                mode: 'from',
                price12k: 700,
                price18k: 850,
                price24k: 950,
                extraServices: []
            });
        }

        let min12k = Infinity;
        let min18k = Infinity;
        let min24k = Infinity;
        let allExtra: any[] = [];

        for (const inst of installers) {
            if (inst.basePrice12k && inst.basePrice12k < min12k) min12k = inst.basePrice12k;
            if (inst.basePrice18k && inst.basePrice18k < min18k) min18k = inst.basePrice18k;
            if (inst.basePrice24k && inst.basePrice24k < min24k) min24k = inst.basePrice24k;
            
            if (inst.extraServices && Array.isArray(inst.extraServices)) {
                allExtra.push(...inst.extraServices);
            }
        }

        // Aggregate extra services to find minimum price per standardized name
        const extraMins: Record<string, number> = {};
        for (const ex of allExtra) {
            if (ex.name && ex.price !== undefined) {
                const standardizedName = ex.name.trim().toLowerCase();
                if (!extraMins[standardizedName] || ex.price < extraMins[standardizedName]) {
                    extraMins[standardizedName] = ex.price;
                }
            }
        }

        const uniqueExtraServices = Object.keys(extraMins).map(key => {
            const originalService = allExtra.find(ex => ex.name.trim().toLowerCase() === key);
            return {
                name: originalService?.name || key,
                price: extraMins[key],
                unit: originalService?.unit || ''
            };
        });

        // Optional: sort alphabetically or take top 10 to avoid huge UI
        const sortedExtra = uniqueExtraServices.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
            success: true,
            mode: 'from',
            price12k: min12k === Infinity ? 700 : min12k,
            price18k: min18k === Infinity ? 850 : min18k,
            price24k: min24k === Infinity ? 950 : min24k,
            extraServices: sortedExtra
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
