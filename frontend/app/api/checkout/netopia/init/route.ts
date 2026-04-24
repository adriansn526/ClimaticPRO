import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { Mobilpay } from 'mobilpay-card';
import fs from 'fs';
import path from 'path';

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
        const body = await request.json();
        
        const { cartTotal, cartItems } = body;
        
        if (!cartTotal || cartTotal <= 0) {
            return NextResponse.json({ success: false, message: 'Totalul cartului este invalid.' }, { status: 400 });
        }

        // CREATE ORDER IN PRISMA
        const orderId = `B2B-${Date.now()}`;
        // Note: You would normally save the order in `Order` and `OrderItems` table.
        // For brevity we will just use a generic transaction here.
        // Let's assume we have an Order model or similar:
        // const newOrder = await prisma.order.create({ ... });

        // INITIALIZE NETOPIA
        const publicCertPath = path.join(process.cwd(), 'certificates', 'public.cer');
        
        if (!fs.existsSync(publicCertPath)) {
            console.error('Certificatul RSA lipsește.', publicCertPath);
            return NextResponse.json({ success: false, message: 'Eroare la procesatorul de plată.' }, { status: 500 });
        }

        const mPay = new Mobilpay(
            '3CWR-XFMK-VRLH-DQHA-ANW4', // Signature
            publicCertPath,
            path.join(process.cwd(), 'certificates', 'private.key') // Needed if using API, though for init we only need public
        );

        mPay.setClientParams({
            billing: {
                firstName: 'Instalator',
                lastName: 'B2B',
                email: 'instalator@climaticpro.ro',
                phone: '0000000000',
                address: 'Adresa Installer'
            },
            shipping: {
                firstName: 'Instalator',
                lastName: 'B2B',
                email: 'instalator@climaticpro.ro',
                phone: '0000000000',
                address: 'Adresa Livrare'
            }
        });

        // Current request origin for return
        const rootUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://climaticpro.ro';
        
        const sessionPayload = {
            amount: parseFloat(cartTotal),
            currency: 'RON',
            orderId: orderId,
            details: `Comanda B2B ClimaticPRO - ${orderId}`,
            returnUrl: `${rootUrl}/api/checkout/success`,
            confirmUrl: `${rootUrl}/api/checkout/netopia/ipn`,
        };

        const { env_key, data } = mPay.buildRequest(sessionPayload);

        return NextResponse.json({ 
            success: true, 
            paymentUrl: 'https://secure.mobilpay.ro', 
            env_key, 
            data 
        });
        
    } catch (error) {
        console.error('Netopia Init Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă Checkout.' }, { status: 500 });
    }
}
