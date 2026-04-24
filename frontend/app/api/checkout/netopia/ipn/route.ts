import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { Mobilpay } from 'mobilpay-card';
import fs from 'fs';
import path from 'path';

const prisma = getPrisma();
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const env_key = formData.get('env_key') as string;
        const data = formData.get('data') as string;

        if (!env_key || !data) {
            return new NextResponse('Eroare: Parametri lipsa IPN', { status: 400 });
        }

        const privateKeyPath = path.join(process.cwd(), 'certificates', 'private.key');
        
        if (!fs.existsSync(privateKeyPath)) {
            console.error('Certificatul RSA PRIVAT lipsește.');
            return new NextResponse('Eroare Internă: Certificat', { status: 500 });
        }

        const mPay = new Mobilpay(
            '3CWR-XFMK-VRLH-DQHA-ANW4',
            path.join(process.cwd(), 'certificates', 'public.cer'),
            privateKeyPath
        );

        const responseObj = mPay.buildResponse(env_key, data);
        const { action, error, orderId, processedAmount } = responseObj;

        // Process IPN Actions
        let responseMessage = 'Message processed successfully';

        if (action === 'confirmed' || action === 'confirmed_pending') {
            // THE PAYMENT WAS SUCCESSFUL
            // Update logic here, e.g. prisma.order.update({ where: { id: orderId } ... })
            console.log(`NETOPIA_IPN: Comanda ${orderId} a fost confirmata cu valoarea de ${processedAmount}`);
        } else if (error && error.code !== '0') {
            console.error(`NETOPIA_IPN: Comanda ${orderId} a fost respinsa/esec: ${error.message}`);
            responseMessage = error.message;
        }

        // Return XML as required by Mobilpay specs to acknowledge receipt
        const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
<crc>${responseMessage}</crc>`;
        
        return new NextResponse(xmlResponse, {
            status: 200,
            headers: { 'Content-Type': 'application/xml' }
        });

    } catch (error) {
        console.error('Netopia IPN Webhook Error:', error);
        return new NextResponse('Internal Webhook Error', { status: 500 });
    }
}
