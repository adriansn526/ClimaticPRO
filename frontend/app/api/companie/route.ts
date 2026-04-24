import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cui = body.cui?.toString().replace(/[^0-9]/g, '');

        if (!cui || cui.length < 2 || cui.length > 10) {
            return NextResponse.json({ success: false, error: 'CUI Invalid' }, { status: 400 });
        }

        const anafPayload = [
            {
                cui: parseInt(cui, 10),
                data: new Date().toISOString().split('T')[0] // current date (YYYY-MM-DD)
            }
        ];

        const response = await fetch('https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(anafPayload)
        });

        if (!response.ok) {
            throw new Error('Eroare la conectarea cu serverele ANAF.');
        }

        const data = await response.json();

        if (data.cod === 200 && data.found && data.found.length > 0) {
            const companyInfo = data.found[0];
            return NextResponse.json({
                success: true,
                company: {
                    name: companyInfo.denumire || '',
                    address: companyInfo.adresa || '',
                    cui: companyInfo.cui,
                    regCom: companyInfo.nrRegCom || ''
                }
            });
        }

        return NextResponse.json({ success: false, error: 'Compania nu a putut fi găsită în registrele ANAF.' }, { status: 404 });

    } catch (error) {
        console.error('ANAF Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Eroare internă. Verifică CUI-ul sau folosește introducerea manuală.' }, { status: 500 });
    }
}
