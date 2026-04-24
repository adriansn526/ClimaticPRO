import { getPrisma } from '@/lib/prisma';
import { Mobilpay } from 'mobilpay-card';
import fs from 'fs';
import path from 'path';

const prisma = getPrisma();

export default async function NetopiaRedirectPage({ searchParams }: { searchParams: { orderId: string, total: string } }) {
    const { orderId, total } = searchParams;
    
    if (!orderId || !total) {
        return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}><h3>Eroare Plată</h3><p>Date comandă invalide.</p></div>;
    }

    const publicCertPath = path.join(process.cwd(), 'certificates', 'public.cer');
    
    if (!fs.existsSync(publicCertPath)) {
        return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}><h3>Eroare Plată</h3><p>Platforma nu are configurat certificatul RSA.</p></div>;
    }

    let env_key = '';
    let data = '';
    let paymentUrl = 'https://secure.mobilpay.ro';

    try {
        const mPay = new Mobilpay(
            '3CWR-XFMK-VRLH-DQHA-ANW4', 
            publicCertPath,
            path.join(process.cwd(), 'certificates', 'private.key')
        );

        mPay.setClientParams({
            billing: { firstName: 'Instalator', lastName: 'ClimaticPRO', email: 'b2b@climaticpro.ro', phone: '0000000000', address: 'România' },
            shipping: { firstName: 'Instalator', lastName: 'ClimaticPRO', email: 'b2b@climaticpro.ro', phone: '0000000000', address: 'România' }
        });

        const rootUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://climaticpro.ro';
        
        const sessionPayload = {
            amount: parseFloat(total),
            currency: 'RON',
            orderId: orderId,
            details: `Comanda B2B ClimaticPRO - ${orderId}`,
            returnUrl: `${rootUrl}/api/checkout/success`,
            confirmUrl: `${rootUrl}/api/checkout/netopia/ipn`,
        };

        const reqStruct = mPay.buildRequest(sessionPayload);
        env_key = reqStruct.env_key;
        data = reqStruct.data;

    } catch(e) {
        console.error(e);
        return <div>Eroare criptare formular Netopia.</div>;
    }

    return (
        <html lang="ro">
            <body style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ marginBottom: 20 }}>🔄</div>
                    <h3>Securizare Conexiune...</h3>
                    <p style={{ color: '#6B7280' }}>Vă redirecționăm către Netopia Payments.</p>
                </div>
                <form id="netopiaForm" action={paymentUrl} method="POST">
                    <input type="hidden" name="env_key" value={env_key} />
                    <input type="hidden" name="data" value={data} />
                </form>
                <script dangerouslySetInnerHTML={{ __html: `document.getElementById('netopiaForm').submit();` }} />
            </body>
        </html>
    );
}
