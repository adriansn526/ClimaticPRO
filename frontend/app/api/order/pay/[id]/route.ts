import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, context: { params: { id: string } }) {
    const { id } = await context.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
        return new NextResponse('Invalid Order ID', { status: 400 });
    }

    try {
        // Fetch order from WooCommerce using REST API
        const wcKey = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WC_CONSUMER_KEY || '';
        const wcSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET || '';
        const siteUrl = process.env.WORDPRESS_API_URL?.replace('/graphql', '') || 'https://cms.climaticpro.ro';

        const wcResponse = await fetch(`${siteUrl}/wp-json/wc/v3/orders/${orderId}`, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${wcKey}:${wcSecret}`).toString('base64')
            }
        });

        if (!wcResponse.ok) {
            console.error('Failed to fetch from WooCommerce:', await wcResponse.text());
            return new NextResponse('Order not found in WooCommerce', { status: 404 });
        }

        const order = await wcResponse.json();

        // Extra info
        const billing = order.billing || {};
        
        // Căutăm totalul hardware (cel relevant pentru plată card), exclusiv instalarea.
        let amountToCharge = parseFloat(order.total);
        if (order.meta_data) {
             const hwMeta = order.meta_data.find((m: any) => m.key === '_hardware_total');
             if (hwMeta && hwMeta.value) {
                 const parsedAmount = parseFloat(hwMeta.value);
                 if (!isNaN(parsedAmount) && parsedAmount > 0) {
                     amountToCharge = parsedAmount;
                 }
             }
        }

        let publicKeyPath = path.join(process.cwd(), 'certs', 'public.cer');
        const sandboxPublicKeyPath = path.join(process.cwd(), 'certs', 'sandbox.public.cer');
        
        let hasNetopiaKeys = fs.existsSync(publicKeyPath);
        if (!hasNetopiaKeys && fs.existsSync(sandboxPublicKeyPath)) {
            publicKeyPath = sandboxPublicKeyPath;
            hasNetopiaKeys = true;
        }

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
                    amount: amountToCharge,
                    currency: 'RON',
                    details: 'Comanda B2C ClimaticPRO #' + order.id,
                    confirmUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/netopia`,
                    returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}`, // Optional: we can route to an order success page
                    orderId: `WC-${order.id}`, // Prefixăm ca să știm că e B2C din WooCommerce
                    billing: {
                        firstName: billing.first_name || 'Client',
                        lastName: billing.last_name || 'ClimaticPRO',
                        email: billing.email || 'contact@climaticpro.ro',
                        phone: billing.phone || '0700000000'
                    }
                });

                envKey = reqData.envKey;
                encData = reqData.envData;
            } catch (error: any) {
                console.error('Eroare la criptarea Netopia B2C:', error);
                return new NextResponse('Eroare interna la procesarea platii Netopia.', { status: 500 });
            }

            return new NextResponse(`
                <!DOCTYPE html>
                <html lang="ro">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Plată Securizată Netopia</title>
                    <style>
                        body { display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f3f4f6; flex-direction:column; }
                        .loader { border: 4px solid #e5e7eb; border-top: 4px solid #2563eb; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px;}
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .desc { color: #4b5563; margin-top: 8px; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="loader"></div>
                    <h2>Te redirecționăm securizat către gateway-ul Netopia...</h2>
                    <p class="desc">Vei achita suma de ${amountToCharge} RON aferentă produselor hardware.</p>
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
             // Fallback dacă nu avem cheile (mediu dev)
             return new NextResponse(`
                <!DOCTYPE html>
                <html lang="ro">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Simulator Platã</title>
                    <style>
                        body { font-family:sans-serif; background:#f3f4f6; padding: 2rem; }
                        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 500px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2 style="color:red;">Mediul Sandbox Local (Fără Chei RSA)</h2>
                        <p>Plata de <b>${amountToCharge} RON</b> pentru Moped/Aparat a fost inițializată, dar nu ai cheile instalate local.</p>
                        <p>ID Comandă: WC-${order.id}</p>
                    </div>
                </body>
                </html>
             `, { headers: { 'Content-Type': 'text/html' } });
        }
    } catch (e: any) {
        console.error("General error pay/route:", e.message);
        return new NextResponse('Eroare', { status: 500 });
    }
}
