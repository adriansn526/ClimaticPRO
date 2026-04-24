import { NextResponse } from 'next/server';
import { getGoogleAccessToken } from '@/lib/google-calendar';
import { getWooCommerceOrders } from '@/lib/woo-admin';
import { getPrisma } from '@/lib/prisma';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';

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

        const busySlots: { start: string, end: string }[] = [];
        const scarceSlots: { start: string, end: string }[] = [];
        
        // 1. Fetch DB Installer Capacities
        const prisma = getPrisma();
        const activeInstallers = await prisma.installerProfile.findMany({
            where: { status: 'approved' },
            select: { dailyCapacity: true, unavailableDates: true }
        });
        
        let globalHolidays: string[] = [];
        try {
            const hSetting = await prisma.appSetting.findUnique({ where: { key: 'global_holidays' } });
            if (hSetting?.value) globalHolidays = JSON.parse(hSetting.value) || [];
        } catch(e) {}

        // 2. Fetch Google Calendar strictly for backward compatibility / existing manual events
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
            if (clientId && clientSecret && refreshToken) {
                const accessToken = await getGoogleAccessToken();
                const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
                const eventsResponse = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    eventsData.items?.forEach((event: any) => {
                        busySlots.push({
                            start: event.start.dateTime || event.start.date,
                            end: event.end.dateTime || event.end.date,
                        });
                    });
                }
            }
        } catch(e) { console.error("Google Calendar Soft Fail:", e); }

        // 3. Evaluate Capacities per day
        try {
            // Aducem comenzile recente WooCommerce (suficient de târziu pentru a acoperi timeMin)
            const d = new Date();
            d.setDate(d.getDate() - 30); // cautam inclusiv comenzi plasate in ultima luna, dar programate acum
            const wcOrders = await getWooCommerceOrders({
                per_page: 100,
                status: 'processing,on-hold,pending',
                after: d.toISOString()
            });

            // Iterate through every day in the requested array
            const currentDate = new Date(timeMin);
            const endDate = new Date(timeMax);
            
            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                
                // Dacă e sărbătoare globală, mark as busy direct
                if (globalHolidays.includes(dateStr)) {
                    busySlots.push({ start: currentDate.toISOString(), end: currentDate.toISOString() });
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                // Calcul Capacitate Zilnică
                let capacity = 0;
                for (const inst of activeInstallers) {
                    try {
                        const parsedUnavailable = Array.isArray(inst.unavailableDates) ? inst.unavailableDates : 
                                                  (typeof inst.unavailableDates === 'string' ? JSON.parse(inst.unavailableDates) : []);
                        if (!parsedUnavailable.includes(dateStr)) {
                            capacity += (inst.dailyCapacity || 3);
                        }
                    } catch(e) {
                         capacity += (inst.dailyCapacity || 3);
                    }
                }

                // Numar comenzi deja programate astazi
                let scheduledToday = 0;
                wcOrders.forEach((o: any) => {
                    const appointmentMeta = o.meta_data.find((m: any) => m.key === 'appointment_date' || m.key === 'programare_instalare' || m.key === 'programare_mentenanta');
                    if (appointmentMeta?.value && appointmentMeta.value.includes(dateStr)) {
                        scheduledToday++;
                    }
                });

                if (scheduledToday >= capacity && capacity > 0) {
                    busySlots.push({ start: currentDate.toISOString(), end: currentDate.toISOString() });
                } else if (capacity > 0 && (capacity - scheduledToday) === 1) {
                    // Mark as scarce (almost full) if exactly 1 slot remains
                    scarceSlots.push({ start: currentDate.toISOString(), end: currentDate.toISOString() });
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
        } catch(e) { console.error("Capacity Calculation Error:", e); }

        return NextResponse.json({ success: true, busySlots, scarceSlots });
    } catch (error) {
        console.error('Calendar API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
