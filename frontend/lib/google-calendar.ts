export async function getGoogleAccessToken() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Missing Google Credentials');
    }

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
        throw new Error(`Failed to refresh token: ${JSON.stringify(tokenData)}`);
    }

    return tokenData.access_token;
}

interface CalendarEventParams {
    summary: string;
    description: string;
    location?: string;
    date: Date | string; // Typically expected as an ISO date string for full-day, or dateTime for specific hours
}

export async function createCalendarEvent(params: CalendarEventParams) {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const accessToken = await getGoogleAccessToken();

    // Determine event time bounds
    const eventDateStr = typeof params.date === 'string' ? params.date : params.date.toISOString();

    // We treat eventDateStr as the start date. For a full-day event, we need start and end date (exclusive).
    // To be safe and precise, we will create an event that spans the whole day if no time is specified,
    // or specifically from 09:00 to 18:00 as an example of a "booking window".

    let start, end;

    // Check if eventDateStr contains time (T marker)
    if (eventDateStr.includes('T')) {
        // Specific time provided
        start = { dateTime: eventDateStr };
        // End time is arbitrarily 2 hours later if not provided otherwise, but let's just make it +2H
        const d = new Date(eventDateStr);
        d.setHours(d.getHours() + 2);
        end = { dateTime: d.toISOString() };
    } else {
        // Just a date provided, e.g., '2025-05-15'
        // Create an all-day event
        const dateObj = new Date(eventDateStr);
        const formattedStartDate = dateObj.toISOString().split('T')[0];

        dateObj.setDate(dateObj.getDate() + 1); // Exclusive end date for all-day events
        const formattedEndDate = dateObj.toISOString().split('T')[0];

        start = { date: formattedStartDate };
        end = { date: formattedEndDate };
    }

    const eventPayload = {
        summary: params.summary,
        description: params.description,
        location: params.location || '',
        start: start,
        end: end,
        colorId: '9', // Blueberry color
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${JSON.stringify(data)}`);
    }

    return data;
}
