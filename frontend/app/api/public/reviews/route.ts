import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // Fallback Place ID in case frontend doesn't send one
        const placeId = searchParams.get('placeId') || 'ChIJnTkg055EY6QRnL2Ykbq5Gzs'; // Actual ClimaticPRO Place ID
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ success: false, message: 'Missing API Key' }, { status: 500 });
        }

        // We use the older Places Details API which is very stable for grabbing the 5 top reviews
        // URL format: https://maps.googleapis.com/maps/api/place/details/json?place_id=PLACE_ID&fields=reviews&language=ro&key=YOUR_API_KEY
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&language=ro&key=${apiKey}`;

        // Fetch with a cache of 24 hours to prevent spamming the Google API and save costs
        const googleResponse = await fetch(url, {
            next: {
                revalidate: 86400 // Cache for 24 hours
            }
        });

        if (!googleResponse.ok) {
            throw new Error(`Google API responded with status: ${googleResponse.status}`);
        }

        const data = await googleResponse.json();

        if (data.status !== 'OK') {
            throw new Error(`Google API error status: ${data.status} - ${data.error_message || ''}`);
        }

        // Format according to the frontend's expected Testimonial structure
        const reviews = data.result?.reviews || [];
        
        const formattedReviews = reviews
            // Only show 5-star or 4-star reviews ideally
            .filter((r: any) => r.rating >= 4 && r.text && r.text.length > 10)
            .slice(0, 3) // We take the top 3 best reviews to display
            .map((r: any, index: number) => ({
                id: `google-${index}`,
                name: r.author_name,
                role: 'Client Google',
                content: r.text,
                rating: r.rating,
                location: r.relative_time_description // e.g. "Acum 2 săptămâni"
            }));

        return NextResponse.json({ 
            success: true, 
            reviews: formattedReviews,
            globalRating: data.result?.rating,
            totalRatings: data.result?.user_ratings_total
        });
    } catch (error: any) {
        console.error('Error fetching Google Reviews:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
