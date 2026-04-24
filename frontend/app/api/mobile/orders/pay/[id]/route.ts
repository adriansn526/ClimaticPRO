import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Dacă foloseam direct netopia-card, am avea nevoie și de tipare, 
// dar pentru claritate și pentru lipsa cheilor actuale implementăm vizualizarea de bază.

export async function GET(request: Request, context: { params: { id: string } }) {
    const { id } = await context.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
        return new NextResponse('Invalid Order ID', { status: 400 });
    }

    const prisma = getPrisma();
    const order = await prisma.b2BOrder.findUnique({ where: { id: orderId } });

    if (!order) {
        return new NextResponse('Order not found', { status: 404 });
    }

    // Aici validăm dacă avem Cheile Netopia puse pe Server în folderul de criptare
    const publicKeyPath = path.join(process.cwd(), 'certs', 'public.cer');
    const hasNetopiaKeys = fs.existsSync(publicKeyPath);

    if (hasNetopiaKeys) {
        let envKey = '';
        let encData = '';
        const mobilpayUrl = process.env.NODE_ENV === 'production' 
            ? 'https://secure.mobilpay.ro' 
            : 'https://sandboxsecure.mobilpay.ro';

        try {
            const MobilPay = require('mobilpay-card');
            const mobilPay = new MobilPay(process.env.NETOPIA_SIGNATURE || '');
            mobilPay.setPublicKey(fs.readFileSync(publicKeyPath, 'utf8'));
            
            const reqData = mobilPay.buildRequest({
                amount: order.totalAmount,
                currency: 'RON',
                details: 'Comanda B2B ClimaticPRO #' + order.id,
                confirmUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/netopia`,
                returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/(public)/redirect`,
                orderId: order.id.toString(),
                billing: {
                    firstName: order.authorName || 'Echipa',
                    lastName: 'Instalator',
                    email: 'contact@climaticpro.ro',
                    phone: '0700000000'
                }
            });

            envKey = reqData.envKey;
            encData = reqData.envData;
        } catch (error: any) {
            console.error('Eroare la criptarea Netopia:', error);
            return new NextResponse('Eroare interna la procesarea platii Netopia S2S.', { status: 500 });
        }

        return new NextResponse(`
            <!DOCTYPE html>
            <html lang="ro">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Secure Netopia Trampoline</title>
                <style>
                    body { display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f3f4f6; flex-direction:column; }
                    .loader { border: 4px solid #e5e7eb; border-top: 4px solid #2563eb; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px;}
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <div class="loader"></div>
                <h2>Te redirectionam securizat catre gateway-ul de plata Netopia...</h2>
                <form id="netopiaForm" action="${mobilpayUrl}" method="POST" style="display:none;">
                    <input type="hidden" name="env_key" value="${envKey}" />
                    <input type="hidden" name="data" value="${encData}" />
                </form>
                <script>
                    document.getElementById('netopiaForm').submit();
                </script>
            </body>
            </html>
        `, { headers: { 'Content-Type': 'text/html' } });
    } else {
        // Fallback / Simulator pentru Sandbox când NU ai cheile implementate
        // Acest vizual ajută Instalatorul să vadă clar simularea completă a unei plăți 3D interne direct in APP fără chei
        const mockWebhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/netopia/mock`;
        
        return new NextResponse(`
            <!DOCTYPE html>
            <html lang="ro">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Simulator Netopia Payments</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 90%; }
                    .logo { filter: grayscale(100%); opacity: 0.5; width: 120px; font-weight: 900; font-size: 24px; color:#6b7280; letter-spacing: -1px; margin: 0 auto 1.5rem auto;}
                    h1 { font-size: 1.25rem; color: #111827; margin: 0 0 1rem 0; }
                    .amount { font-size: 2rem; font-weight: 800; color: #2563eb; margin: 1rem 0; }
                    p { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }
                    .btn { background: #10b981; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s; }
                    .btn:hover { background: #059669; }
                    .note { margin-top: 1rem; font-size: 0.75rem; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">NETOPIA</div>
                    <h1>Testare Plată cu Cardul</h1>
                    <div class="amount">${order.totalAmount.toFixed(2)} RON</div>
                    <p>Suntem în Modul <b>Simulator (Sandbox)</b> pentru că nu ai configurat cheile financiare de Producție (<i>public.cer / private.key</i>) pe serverul web.</p>
                    
                    <form action="${mockWebhookUrl}" method="POST">
                        <input type="hidden" name="orderId" value="${order.id}">
                        <button type="submit" class="btn">Simulează Tranzacție Aprobată</button>
                    </form>
                    
                    <div class="note">Prin testare, serverul tău va prelua confirmarea IPN falsă și va muta comanda automat în starea "PAID". Pentru modul REAL va fi nevoie să încărcați cheile în folderul <code>certs/</code></div>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}
