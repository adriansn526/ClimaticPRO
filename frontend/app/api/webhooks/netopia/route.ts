import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    const devPublicKeyPath = path.join(process.cwd(), 'certs', 'sandbox.public.cer');
    const devPrivateKeyPath = path.join(process.cwd(), 'certs', 'sandbox.private.key');
    const prodPublicKeyPath = path.join(process.cwd(), 'certs', 'public.cer');
    const prodPrivateKeyPath = path.join(process.cwd(), 'certs', 'private.key');

    let publicKeyPath = prodPublicKeyPath;
    let privateKeyPath = prodPrivateKeyPath;

    // Fallback la dev/sandbox dacă ne lipsesc cele de producție (în sandbox)
    if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {
        if (fs.existsSync(devPublicKeyPath) && fs.existsSync(devPrivateKeyPath)) {
            publicKeyPath = devPublicKeyPath;
            privateKeyPath = devPrivateKeyPath;
        } else {
            return new NextResponse('Internal Error: Missing Payment Keys', { status: 500 });
        }
    }

    try {
        const formData = await request.formData();
        const envKey = formData.get('env_key');
        const data = formData.get('data');

        if (!envKey || !data) {
            return new NextResponse('Invalid IPN Data', { status: 400 });
        }

        let decoded: any;
        try {
            const MobilPay = require('mobilpay-card');
            const mobilPay = new MobilPay(process.env.NETOPIA_SIGNATURE || '');
            mobilPay.setPrivateKey(fs.readFileSync(privateKeyPath, 'utf8'));

            decoded = mobilPay.validatePayment(envKey.toString(), data.toString());
        } catch (error: any) {
            console.error('IPN Validation Failed:', error);
            return new NextResponse('Invalid IPN Signature', { status: 400 });
        }

        const action = decoded.action || decoded.status;
        const prisma = getPrisma();

        const orderIdStr = decoded.orderId.toString();

        if (orderIdStr.startsWith('WC-')) {
            // Este o comandă B2C din site direcționată prin WooCommerce
            const wcOrderId = parseInt(orderIdStr.replace('WC-', ''), 10);
            const wcKey = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WC_CONSUMER_KEY || '';
            const wcSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET || '';
            const siteUrl = process.env.WORDPRESS_API_URL?.replace('/graphql', '') || 'https://cms.climaticpro.ro';

            if (action === 'confirmed' || action === 'paid' || action === 'confirmed_pending') {
                // Set to processing
                await fetch(`${siteUrl}/wp-json/wc/v3/orders/${wcOrderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + Buffer.from(`${wcKey}:${wcSecret}`).toString('base64')
                    },
                    body: JSON.stringify({ status: 'processing', payment_method: 'netopia', transaction_id: decoded.transEnv || '' })
                });
            } else if (action === 'rejected' || action === 'canceled') {
                // Set to failed
                await fetch(`${siteUrl}/wp-json/wc/v3/orders/${wcOrderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + Buffer.from(`${wcKey}:${wcSecret}`).toString('base64')
                    },
                    body: JSON.stringify({ status: 'failed' })
                });
            }

        } else {
            // Este o comandă B2B din aplicația mobilă
            const prisma = getPrisma();
            if (action === 'confirmed' || action === 'paid' || action === 'confirmed_pending') {
                 await prisma.b2BOrder.update({
                      where: { id: parseInt(orderIdStr) },
                      data: { paymentStatus: 'paid', status: 'processing', paymentMethod: 'netopia' }
                 });
            } else if (action === 'rejected' || action === 'canceled') {
                 await prisma.b2BOrder.update({
                      where: { id: parseInt(orderIdStr) },
                      data: { paymentStatus: 'failed' }
                 });
            }
        }

        // Obligatoriu pentru serverele Netopia: trebuie să răspundem cu acest XML pentru a confirma IPN
        return new NextResponse(`<?xml version="1.0" encoding="utf-8"?>\n<crc>OK</crc>`, {
            headers: { 'Content-Type': 'application/xml' }
        });
    } catch (e: any) {
        console.error("Netopia IPN Error:", e.message);
        return new NextResponse('Error handling IPN', { status: 500 });
    }
}
