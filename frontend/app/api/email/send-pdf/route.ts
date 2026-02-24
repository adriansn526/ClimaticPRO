import { NextResponse } from 'next/server';
import { sendGenericEmail } from '@/lib/email';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import WarrantyPDF from '@/components/pdfs/WarrantyPDF';
import InvoicePDF from '@/components/pdfs/InvoicePDF';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { jobId, clientEmail, type, installerName, data } = body;

        if (!jobId || !clientEmail || !type || !data) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
        }

        const subject = type === 'warranty'
            ? `Certificat Garanție - Lucrare #${jobId}`
            : `Factură Fiscală - Lucrare #${jobId}`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bună ziua,</h2>
                <p>Atașat regăsiți documentul <strong>${type === 'warranty' ? 'Certificat de Garanție' : 'Factura Fiscală'}</strong> aferent lucrării dvs. (ID: #${jobId}).</p>
                <p>Instalator partener: <strong>${installerName || 'Echipa ClimaticPRO'}</strong></p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    Acest email a fost generat automat prin platforma ClimaticPRO.<br>
                    Pentru întrebări, puteți răspunde la acest email.
                </p>
            </div>
        `;

        // Generate PDF Buffer
        let doc;
        let filename;

        if (type === 'warranty') {
            doc = React.createElement(WarrantyPDF, data);
            filename = `Garantie_${jobId}.pdf`;
        } else {
            doc = React.createElement(InvoicePDF, data);
            filename = `Factura_${jobId}.pdf`;
        }

        const stream = await ReactPDF.renderToStream(doc as any);

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        const success = await sendGenericEmail({
            to: clientEmail,
            cc: 'contact@climaticpro.ro',
            subject,
            html: htmlContent,
            attachments: [
                {
                    filename: filename,
                    content: buffer
                }
            ]
        });

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Email sending failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Email API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
