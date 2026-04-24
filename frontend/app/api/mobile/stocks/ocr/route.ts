import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'secret';
        
        let decoded: any;
        try {
            decoded = jwt.verify(token, secret);
        } catch {
            return NextResponse.json({ success: false, message: 'Token invalid' }, { status: 401 });
        }

        const installerId = decoded.userId || decoded.id;

        // Verify if user is Internal
        const installerProfile = await (prisma as any).installerProfile.findUnique({
            where: { userId: installerId }
        });

        if (!installerProfile?.isInternal) {
            return NextResponse.json({ success: false, message: 'Funcția OCR este disponibilă doar forței de muncă interne.' }, { status: 403 });
        }

        const body = await request.json();
        const { base64Image } = body;

        if (!base64Image) {
            return NextResponse.json({ success: false, message: 'Fișierul imagine lipsește.' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, message: 'OpenAI API Key nu este configurată pe server.' }, { status: 500 });
        }

        const prompt = `
            Ești un extractor OCR ultra-precis pentru facturi în format tabelar.
            Această imagine este OBLIGATORIU parcursă cu maximă atenție din cauza alinierii spațiale complexe a coloanelor.
            Coloanele sunt, în ordine de la stânga la dreapta: Nr. Crt | Denumire | U.M. | Cantitate | Preț Unitar (fără TVA) | Valoare (fără TVA) | Valoare TVA.
            Eroarea fatală pe care ești predispus să o faci: confunzi coloana "Cantitate" cu o cifră de pe rândul de mai jos/sus, sau citești coloana "Valoare" în loc de "Preț Unitar", sau citești "TVA" în loc de Preț.
            Regula 1: Identifică rândul. Urmărește degeteală orizontală imaginară de la numele produsului direct spre cantitate. Extrage EXACT cifra de sub capul de tabel "Cantitate" pentru acel rând curent.
            Regula 2: Prețul unitar este strict sub coloana "Preț unitar". IGNORĂ coloanele Valoare și TVA.
            Regula 3: NU face matematică absolut deloc. Nu deduce.

            Pentru a te asigura că nu sari rânduri, extrage fiecare rând succesiv de la 1 la capăt.

            Formatul cerut:
            Răspunde STRICT folosind acest format JSON:
            {
               "items": [
                  {
                    "name": "Nume extras (STR)",
                    "quantity": Număr cantitate de pe acel rând,
                    "unit": "buc" / "ml" / "set",
                    "price": Prețul unitar extras FĂRĂ a face calcule,
                    "tva": 19,
                    "type": "piese" / "scule" / "material" / "echipament"
                  }
               ]
            }
        `;

        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: "high" } }
                        ]
                    }
                ],
                max_tokens: 4000,
                temperature: 0.0,
                response_format: { type: "json_object" }
            })
        });

        const openAiData = await openAiResponse.json();

        if (!openAiResponse.ok) {
            console.error("OpenAI Error:", openAiData);
            return NextResponse.json({ success: false, message: 'Eroare la procesarea AI.' }, { status: 500 });
        }

        let rawResponseText = openAiData.choices?.[0]?.message?.content || "{}";
        
        // Curățare eventuale marcaje
        rawResponseText = rawResponseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let extractedItems = [];
        try {
            const parsed = JSON.parse(rawResponseText);
            extractedItems = parsed.items || parsed;
        } catch (err) {
            console.error("Failed to parse OpenAI JSON response:", rawResponseText);
            return NextResponse.json({ success: false, message: 'AI-ul a generat un format invalid.' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            items: extractedItems 
        });

    } catch (error) {
        console.error('OCR Endpoint Error:', error);
        return NextResponse.json({ success: false, message: 'Server Eroare internă al extragerii' }, { status: 500 });
    }
}
