import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'documents', 'tunnel.txt');
        
        if (fs.existsSync(filePath)) {
            const urlRaw = fs.readFileSync(filePath, 'utf8').trim();
            if (urlRaw && urlRaw.startsWith('https://')) {
                const finalUrl = urlRaw.replace('https://', 'exp://');
                return NextResponse.redirect(finalUrl);
            }
        }
        
        return new NextResponse(`
            <html>
                <body>
                    <h2>Niciun server tunel Expo activ nu a fost găsit.</h2>
                    <p>Asigurați-vă că pm2 expo-dev rulează cu "--tunnel".</p>
                </body>
            </html>
        `, {
            status: 404,
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (e) {
        return new NextResponse(`
            <html>
                <body>
                    <h2>Eroare de conexiune la Ngrok Tunel.</h2>
                    <p>Server-ul webhook intern e off.</p>
                </body>
            </html>
        `, {
            status: 500,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}
