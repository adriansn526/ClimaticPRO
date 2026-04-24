import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const htmlResponse = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Plată Finalizată - ClimaticPRO</title>
        <style>
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; alignItems: center; height: 100vh; background-color: #F3F4F6; color: #111827; text-align: center; margin: 0; }
            .container { background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 90%; }
            .success-icon { font-size: 64px; color: #10B981; margin-bottom: 20px; }
            h1 { margin-bottom: 10px; font-size: 24px; }
            p { color: #6B7280; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
            .btn { background-color: #2563EB; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; text-decoration: none; cursor: pointer; }
        </style>
    </head>
    <body style="display: flex; align-items: center; justify-content: center;">
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Tranzacție Inițiată</h1>
            <p>Plata dumneavoastră a fost procesată și confirmată de bancă. Vă mulțumim pentru comanda B2B ClimaticPRO!</p>
            <a href="climaticpro://" class="btn" onclick="window.close();">Întoarce-te în Aplicație</a>
        </div>
        <script>
            setTimeout(() => {
                window.location.href = "climaticpro://";
                // Încercăm și închiderea filei dacă e deschisă dintr-un WebView/Popup.
                window.close();
            }, 3000);
        </script>
    </body>
    </html>
    `;
    
    return new NextResponse(htmlResponse, {
        status: 200,
        headers: {
            'Content-Type': 'text/html',
        },
    });
}
