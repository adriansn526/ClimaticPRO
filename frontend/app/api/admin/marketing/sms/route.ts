import { NextResponse } from 'next/server';
import { getAudiencePhones } from './audienceHelper';

export async function POST(req: Request) {
    try {
        const { message, senderId, audienceType, audienceParam } = await req.json();

        if (!message) {
            return NextResponse.json({ success: false, error: 'Mesajul SMS este obligatoriu' }, { status: 400 });
        }

        const type = audienceType || 'toata_baza';
        const param = audienceParam || '';

        const uniquePhones = await getAudiencePhones(type, param);

        if (uniquePhones.length === 0) {
            return NextResponse.json({ success: false, error: 'Audiența este goală sau telefoanele nu sunt invalide/lipsesc.' }, { status: 400 });
        }

        // 2. Call SMSO API For Each Target
        const API_KEY = '6iABkheApb8L6a0bpJY2amhCYPD5Bo9zu9a4EuHj';
        let successCount = 0;
        let failCount = 0;

        for (const target of uniquePhones) {
            try {
                // Shortcode Replacements
                let personalizedMessage = message;
                personalizedMessage = personalizedMessage.replace(/{nume_client}/gi, target.nume_client || 'Client');
                personalizedMessage = personalizedMessage.replace(/{data_comenzii}/gi, target.data_comenzii || 'Data achiziției');
                personalizedMessage = personalizedMessage.replace(/{nume_aparat}/gi, target.nume_aparat || 'Aparat de aer condiționat');

                // Prepare form data
                const formData = new URLSearchParams();
                formData.append('to', target.phone);
                formData.append('body', personalizedMessage);
                formData.append('sender', senderId || '4');

                const response = await fetch('https://app.smso.ro/api/v1/send', {
                    method: 'POST',
                    headers: {
                        'X-Authorization': API_KEY,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData.toString()
                });

                if (response.ok) {
                    successCount++;
                } else {
                    const err = await response.text();
                    console.error('SMSO Error for', target.phone, err);
                    failCount++;
                }
            } catch (e) {
                console.error('SMSO Dispatch Error', e);
                failCount++;
            }

            // Respect API rate limits (mild delay)
            await new Promise(r => setTimeout(r, 100));
        }

        return NextResponse.json({
            success: true,
            message: `Campanie trimisă! Sugestii reușite: ${successCount}, Eșuate: ${failCount}`,
            stats: { total: uniquePhones.length, success: successCount, failed: failCount }
        });

    } catch (error: any) {
        console.error('Error sending SMS campaign', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
