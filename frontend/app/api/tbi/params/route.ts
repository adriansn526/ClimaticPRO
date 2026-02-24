
import { NextResponse } from 'next/server';

const TBI_LIVE_URL = 'https://tbicp.com';

// Simple in-memory cache
let cachedParams: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET() {
    try {
        const unicid = process.env.TBI_UNICID;

        if (!unicid) {
            return NextResponse.json({ error: 'TBI configuration missing' }, { status: 500 });
        }

        const now = Date.now();
        if (cachedParams && (now - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json(cachedParams);
        }

        const paramsResponse = await fetch(`${TBI_LIVE_URL}/function/getparameters.php?cid=${unicid}`, {
            next: { revalidate: 3600 } // Next.js cache
        });

        if (!paramsResponse.ok) {
            throw new Error('Failed to fetch from TBI');
        }

        const params = await paramsResponse.json();

        // Update local cache
        cachedParams = params;
        lastFetchTime = now;

        return NextResponse.json(params);

    } catch (error: any) {
        console.error('TBI Params Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
