import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // TODO: Replace with actual Google My Business API integration
        // Requires: 
        // 1. Google Cloud Service Account JSON Key
        // 2. Google My Business API enabled
        // 3. The specific Location ID / Account ID for ClimaticPRO

        const MOCK_REVIEWS = [
            {
                id: '1',
                reviewer_name: 'Alexandru Popescu',
                rating: 5,
                comment: 'Montajul de la unitatea de aer a decurs excelent. Băieții au fost profesioniști și au lăsat curat în urmă.',
                createTime: '2024-03-01T10:00:00Z',
                reply: null
            },
            {
                id: '2',
                reviewer_name: 'Maria Ionescu',
                rating: 4,
                comment: 'Aparat bun, serviciu ok. Singura problemă a fost o întârziere de 15 minute la montaj.',
                createTime: '2024-02-28T14:30:00Z',
                reply: {
                    comment: 'Ne cerem scuze pentru întârziere...'
                }
            },
            {
                id: '3',
                reviewer_name: 'Ion Manea',
                rating: 5,
                comment: 'Super firmă, recomand!',
                createTime: '2024-02-20T09:15:00Z',
                reply: null
            }
        ];

        return NextResponse.json({
            success: true,
            account_connected: false, // Flag to show UI that it needs configuration
            reviews: MOCK_REVIEWS,
            metrics: {
                averageRating: 4.8,
                totalReviewCount: 145
            }
        });

    } catch (error: any) {
        console.error('Error fetching Google Reviews', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
