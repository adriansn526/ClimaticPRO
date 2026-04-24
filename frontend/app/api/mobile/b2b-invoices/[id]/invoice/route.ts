import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import B2BInvoicePDF from '@/components/pdfs/B2BInvoicePDF';
import * as fs from 'fs';
import * as path from 'path';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();

export const dynamic = 'force-dynamic';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    } catch {
        return null;
    }
}

export async function GET(request: Request, context: any) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }
        const installerId = user.userId || user.id;

        const { params } = context;
        const orderId = Number(params.id);

        if (isNaN(orderId)) {
            return NextResponse.json({ success: false, message: 'ID comandă invalid.' }, { status: 400 });
        }

        // 1. Fetch Order and Verify Ownership
        const order = await prisma.b2BOrder.findUnique({
            where: { id: orderId }
        });

        if (!order || order.installerId !== installerId) {
            return NextResponse.json({ success: false, message: 'Comanda nu a fost găsită sau nu îți aparține' }, { status: 404 });
        }

        // 2. Check if already generated
        const currentUrls: string[] = Array.isArray((order as any).documentUrls) ? ((order as any).documentUrls as string[]) : [];
        if (currentUrls.length > 0) {
            return NextResponse.json({ success: true, url: currentUrls[0] });
        }

        // 3. Fetch Installer (Buyer)
        const profile = await prisma.installerProfile.findUnique({
            where: { userId: order.installerId }
        });

        if (!profile) {
            return NextResponse.json({ success: false, message: 'Profil instalator negăsit' }, { status: 404 });
        }

        // 4. Fetch Admin Settings (Seller)
        const settingsRaw = await prisma.appSetting.findMany();
        const settingsMap: Record<string, string> = {};
        settingsRaw.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        const sellerData = {
            companyName: settingsMap.companyName || 'ClimaticPRO S.R.L.',
            cui: settingsMap.cui || '',
            regCom: settingsMap.regCom || '',
            address: settingsMap.address || '',
            bankName: settingsMap.bankName || '',
            iban: settingsMap.iban || '',
            contactPhone: settingsMap.contactPhone || ''
        };

        const buyerData = {
            companyName: profile.companyName || profile.name || 'Instalator Autorizat',
            cui: profile.cui || '-',
            regCom: profile.regCom || '-',
            address: profile.address || '-',
            bankName: profile.bankName || undefined,
            iban: profile.iban || undefined
        };

        const items = (order.items as any[]) || [];
        
        // 5. Render PDF
        console.log(`[MOBILE INVOICE API] Rendering PDF for B2B Order ${orderId}`);
        const isProforma = (order.status === 'new' || order.status === 'processing');
        
        const pdfContent = React.createElement(B2BInvoicePDF, {
            isProforma,
            invoiceNumber: orderId.toString().padStart(5, '0'),
            date: new Date(order.createdAt).toLocaleDateString('ro-RO'),
            seller: sellerData,
            buyer: buyerData,
            items: items.map(item => ({
                name: item.name || 'Produs fără nume',
                quantity: item.quantity || 1,
                price: Number(item.price) || 0
            })),
            total: Number(order.totalAmount) || 0
        });

        const buf = await renderToBuffer(pdfContent as any);

        // 6. Save File Locally
        const dirPath = path.join(process.cwd(), 'data', 'documents', 'b2b');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        const docFormatName = isProforma ? 'Proforma' : 'Fiscala';
        const fileName = `${docFormatName}_B2B_${orderId}_${Date.now()}.pdf`;
        const filePath = path.join(dirPath, fileName);
        await fs.promises.writeFile(filePath, buf as Buffer);
        
        const publicUrl = `/api/documents/b2b/${fileName}`;

        // 7. Push to DB archive log
        currentUrls.push(publicUrl);
        await prisma.b2BOrder.update({
            where: { id: orderId },
            data: { documentUrls: currentUrls } as any
        });

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error) {
        console.error('[MOBILE INVOICE API] Server Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă la generare PDF.' }, { status: 500 });
    }
}
