import { NextResponse } from 'next/server';
import { getAudiencePhones } from '../audienceHelper';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'toata_baza';
        const param = searchParams.get('param') || '';

        const phones = await getAudiencePhones(type, param);

        return NextResponse.json({
            success: true,
            count: phones.length
        });

    } catch (error: any) {
        console.error('Error fetching SMS audience count', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
