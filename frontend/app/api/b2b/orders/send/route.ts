import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { sendGenericEmail } from '@/lib/email';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import B2BOrderPDF from '@/components/pdfs/B2BOrderPDF';

const prisma = getPrisma();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 });
        }

        const id = parseInt(orderId);

        // Fetch Order
        const order = await prisma.b2BOrder.findUnique({
            where: { id }
        });

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const items = order.items as any[];

        // Group items by Supplier
        // Structure of items: { productId, name, quantity, price, supplierData: [{ supplierId, price, stock }] }
        // We need to assume that the admin has SELECTED a supplier for each item. 
        // For now, let's assume the first supplier in the list is the chosen one, OR that the item has a specific `chosenSupplierId` field.
        // Since we didn't implement supplier selection UI yet, let's look at `B2B orders page` logic again.
        // It seems `supplierData` is just an array of options.

        // AUTO-SELECT LOGIC (Temporary): Pick the cheapest supplier for each item
        interface OrderItem {
            name: string;
            quantity: number;
            price: number;
            supplierId: number;
            supplierPrice: number;
        }

        const supplierGroups: Record<number, OrderItem[]> = {};

        for (const item of items) {
            if (item.supplierData && item.supplierData.length > 0) {
                // Find best supplier (lowest price)
                const bestSupplier = item.supplierData.reduce((prev: any, curr: any) =>
                    parseFloat(prev.price) < parseFloat(curr.price) ? prev : curr
                );

                const sId = parseInt(bestSupplier.supplierId);

                if (!supplierGroups[sId]) {
                    supplierGroups[sId] = [];
                }

                supplierGroups[sId].push({
                    name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(bestSupplier.price),
                    supplierId: sId,
                    supplierPrice: parseFloat(bestSupplier.price)
                });
            } else {
                // Item has no supplier - Internal Stock?
                // Skip for now or assign to "Internal"
            }
        }

        const supplierIds = Object.keys(supplierGroups).map(Number);

        if (supplierIds.length === 0) {
            return NextResponse.json({ success: false, message: 'No suppliers found for items in this order.' }, { status: 400 });
        }

        // Fetch Supplier Details
        const suppliers = await prisma.supplier.findMany({
            where: { id: { in: supplierIds } }
        });

        const results = [];

        // Send Email to each Supplier
        for (const supplier of suppliers) {
            const supplierItems = supplierGroups[supplier.id];

            // Generate PDF
            const pdfData = {
                orderId: order.id,
                date: new Date().toLocaleDateString('ro-RO'),
                supplier: {
                    name: supplier.name,
                    cui: supplier.cui || '',
                    address: supplier.address || ''
                },
                buyer: {
                    companyName: "ClimaticPRO S.R.L.",
                    cui: "RO12345678",
                    address: "Str. Exemplu nr. 1, București",
                    bank: "ING Bank",
                    iban: "RO00INGB0000000000000000"
                },
                items: supplierItems
            };

            const doc = React.createElement(B2BOrderPDF, pdfData);
            const stream = await ReactPDF.renderToStream(doc as any);

            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);

            // Send Email
            if (supplier.email) {
                await sendGenericEmail({
                    to: supplier.email,
                    cc: 'comenzi@climaticpro.ro',
                    subject: `Comandă Nouă #${orderId} - ClimaticPRO`,
                    html: `
                        <p>Bună ziua,</p>
                        <p>Atașat regăsiți o nouă comandă (ID: #${orderId}) de la ClimaticPRO.</p>
                        <p>Vă rugăm să ne confirmați disponibilitatea și termenul de livrare.</p>
                        <br>
                        <p>Mulțumim,</p>
                        <p>Echipa ClimaticPRO</p>
                    `,
                    attachments: [
                        {
                            filename: `Comanda_${orderId}_${supplier.name.replace(/\s+/g, '_')}.pdf`,
                            content: buffer
                        }
                    ]
                });
                results.push({ supplier: supplier.name, status: 'sent' });
            } else {
                results.push({ supplier: supplier.name, status: 'skipped_no_email' });
            }
        }

        // Update Order Status
        await prisma.b2BOrder.update({
            where: { id },
            data: { status: 'sent_to_supplier' }
        });

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Send Order Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
