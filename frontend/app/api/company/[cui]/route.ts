import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(
    request: Request,
    { params }: { params: { cui: string } }
) {
    const cui = params.cui;

    // Fetch from internal DataCore service
    try {
        // DataCore runs on port 3000 within the docker network
        const response = await fetch(`http://datacore:3000/v1/${cui}`, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            // If 404, it might mean company not found or service issues
            if (response.status === 404) {
                return NextResponse.json({ error: 'Company not found' }, { status: 404 });
            }
            const errorText = await response.text();
            console.error('DataCore error:', response.status, errorText);
            return NextResponse.json({ error: 'DataCore service error' }, { status: response.status });
        }

        const json = await response.json();

        // DataCore returns: { message: "Success", data: { ...fields... }, ... }
        // We pass the whole JSON or just the data. The frontend likely expects the wrapper or just data.
        // Looking at checkout/page.tsx:
        // const result = await response.json();
        // if (result.data) { const company = result.data; ... }

        // So passing the whole JSON is correct as DataCore returns { data: ... }

        return NextResponse.json(json);

    } catch (error) {
        console.error('DataCore Proxy Error:', error);
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
}
