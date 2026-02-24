import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const timeMin = searchParams.get('timeMin');
        const timeMax = searchParams.get('timeMax');

        if (!timeMin || !timeMax) {
            return NextResponse.json({ error: 'Missing timeMin or timeMax' }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            console.warn('Missing Google Credentials - returning empty slots');
            // Return empty slots so the frontend doesn't crash, effectively making all slots "available"
            // or at least allowing the UI to render.
            return NextResponse.json({ success: true, busySlots: [] });
        }

        // 1. Get Access Token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Failed to refresh token:', tokenData);
            return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
        }

        const accessToken = tokenData.access_token;

        // 2. Fetch Events
        const eventsResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const eventsData = await eventsResponse.json();

        if (!eventsResponse.ok) {
            // Fallback: if 'primary' fails, try to use the specific calendar ID from previous context if hardcoded, 
            // but for now return error.
            console.error('Failed to fetch events:', eventsData);
            return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
        }

        // 3. Transform to Busy Slots
        const busySlots = eventsData.items.map((event: any) => ({
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
        }));

        return NextResponse.json({ success: true, busySlots });
    } catch (error) {
        console.error('Calendar API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
