import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const formData = await request.formData();
    const orderIdStr = formData.get('orderId');

    if (!orderIdStr) {
        return new NextResponse('Missing Order ID', { status: 400 });
    }

    const orderId = parseInt(orderIdStr.toString());

    if (isNaN(orderId)) {
        return new NextResponse('Invalid Order ID', { status: 400 });
    }

    const prisma = getPrisma();

    // Actualizăm comanda ca plătită deoarece suntem în mediul de Mock
    await prisma.b2BOrder.update({
        where: { id: orderId },
        data: {
            paymentStatus: 'paid',
            status: 'paid'
        }
    });

    console.log(`✅ [NETOPIA SIMULATOR] Comanda B2B #${orderId} a fost achitată cu succes cu cardul de test.`);

    // Returnăm un document HTML capabil să redirecteze pachetul expo-web-browser pe firul nativ
    return new NextResponse(`
        <!DOCTYPE html>
        <html lang="ro">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redirecting...</title>
            <script>
                // Se întoarce automat nativ în App (Închide WebBrowser-ul)
                window.location.href = "climaticpro://payment-success";
                
                // Fallback peste 2 secunde in caz ca app-ul nu a deschis schema
                setTimeout(() => {
                    document.body.innerHTML = "<h2>Cont aprobat. Poți închide această fereastră (Apasă 'Gata/Done' sus pe ecran).</h2>";
                }, 2000);
            </script>
            <style>
                body { font-family: sans-serif; text-align: center; margin-top: 20%; color: #111827; }
                h2 { color: #10b981; }
            </style>
        </head>
        <body>
            <h3>Validare Confirmată. Te întoarcem în aplicație...</h3>
        </body>
        </html>
    `, {
        headers: {
            'Content-Type': 'text/html'
        }
    });
}
