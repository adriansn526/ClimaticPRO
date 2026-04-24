import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export async function GET(request: Request) {
    try {
        // @ts-ignore
        const rules = await prisma.shippingZoneRule.findMany({
            orderBy: { countyCode: 'asc' }
        });
        return NextResponse.json({ success: true, rules });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // @ts-ignore
        const newRule = await prisma.shippingZoneRule.create({
            data: {
                countyCode: body.countyCode,
                standardShippingFee: parseFloat(body.standardShippingFee) || 120,
                hasLocalInstallers: Boolean(body.hasLocalInstallers),
                waiveShippingIfInstalled: Boolean(body.waiveShippingIfInstalled),
                active: Boolean(body.active)
            }
        });
        return NextResponse.json({ success: true, rule: newRule });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        
        // @ts-ignore
        const updatedRule = await prisma.shippingZoneRule.update({
            where: { id: parseInt(body.id) },
            data: {
                countyCode: body.countyCode,
                standardShippingFee: parseFloat(body.standardShippingFee) || 120,
                hasLocalInstallers: Boolean(body.hasLocalInstallers),
                waiveShippingIfInstalled: Boolean(body.waiveShippingIfInstalled),
                active: Boolean(body.active)
            }
        });
        return NextResponse.json({ success: true, rule: updatedRule });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        // @ts-ignore
        await prisma.shippingZoneRule.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
