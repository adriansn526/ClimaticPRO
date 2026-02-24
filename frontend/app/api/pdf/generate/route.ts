
import { NextResponse } from 'next/server';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import WarrantyPDF from '@/components/pdfs/WarrantyPDF';
import InvoicePDF from '@/components/pdfs/InvoicePDF';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
        }

        // Generate PDF
        let doc;
        let filename;

        if (type === 'warranty') {
            doc = React.createElement(WarrantyPDF, data);
            filename = `Garantie.pdf`; // ID usually in data
        } else {
            doc = React.createElement(InvoicePDF, data);
            filename = `Factura.pdf`;
        }

        const stream = await ReactPDF.renderToStream(doc as any);

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('PDF Generation API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
