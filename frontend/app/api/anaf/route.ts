import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cuiRaw = body.cui;
        if (!cuiRaw) {
            return NextResponse.json({ success: false, message: 'CUI inexistent' }, { status: 400 });
        }

        // Curățare CUI (se pot introduce RO sau spații incorect)
        const cuiFormatat = cuiRaw.replace(/[^0-9]/g, '');

        // Generăm data zilei curente YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        const payload = [
            {
                "cui": parseInt(cuiFormatat, 10),
                "data": today
            }
        ];

        const response = await fetch('https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
             throw new Error('Eroare rețea de la serviciul ANAF');
        }

        const data = await response.json();

        if (data.cod === 200 && data.found && data.found.length > 0) {
            const company = data.found[0];
            return NextResponse.json({ 
                success: true, 
                companyName: company.denumire, 
                address: company.adresa,
                cui: company.cui, // curățat
                tvaDate: company.scpTVA
            });
        }

        return NextResponse.json({ success: false, message: 'Firma nu a fost găsită' }, { status: 404 });

    } catch (error: any) {
        console.error("ANAF Proxy Error:", error);
        return NextResponse.json({ success: false, message: 'Eroare conexiune ANAF' }, { status: 500 });
    }
}
