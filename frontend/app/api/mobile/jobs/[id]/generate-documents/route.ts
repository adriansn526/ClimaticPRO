import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import DocumentTemplate from '@/components/pdfs/ServiceDocumentTemplate';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-keep-safe-in-prod';

export const dynamic = 'force-dynamic';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    
    // Mock token bypass for standard web UI without device
    if (token === 'mock-jwt-token-for-dev' || token === 'mock-jwt-token-fallback' || token === 'mock-jwt-token') {
        return { userId: '1', role: 'installer' };
    }
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch {
        return null;
    }
}

const setCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

export async function POST(request: Request, context: any) {
    try {
        const { params } = context;
        const jobIdStr = params.id;
        
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const body = await request.json();
        const { pv, garantie, factura, serialInternal, serialExternal, signature } = body;

        // Fetch Job
        const job = await prisma.job.findUnique({
            where: { id: parseInt(jobIdStr) }
        });

        if (!job) {
            return setCors(NextResponse.json({ success: false, message: 'Lucrare inexistentă' }, { status: 404 }));
        }

        // Fetch Installer
        const profile = await prisma.installerProfile.findFirst({
            where: { userId: job.installerId }
        });

        if (!profile) {
            return setCors(NextResponse.json({ success: false, message: 'Profil instalator negăsit' }, { status: 404 }));
        }

        const jobMeta = job.metadata as any || {};
        
        const installerData = {
            companyName: profile.companyName || 'Instalator Autorizat',
            cui: profile.cui || '',
            regCom: profile.regCom || '',
            address: profile.address || '',
            iban: profile.iban || '',
            bank: profile.bankName || ''
        };

        const hasWebsiteBaseAmount = !!jobMeta.amount && String(jobMeta.amount).trim() !== '' && !['Necomunicat', 'Calculare...'].includes(String(jobMeta.amount));
        let baseLaborNum = 0;
        if (hasWebsiteBaseAmount) {
            const match = String(jobMeta.amount).match(/(\d+(\.\d+)?)/);
            baseLaborNum = match ? parseFloat(match[1]) : 0;
        } else {
            // As per user request, we eliminate the implicit labor price for manual jobs.
            baseLaborNum = 0;
        }

        const extraCosts = jobMeta.extraCosts || [];
        const productsArr = jobMeta.products || [];

        const productsTotal = productsArr.reduce((sum: number, p: any) => {
            const pQty = parseFloat(String(p.quantity || '1').replace(',', '.')) || 1;
            return sum + (parseFloat(p.price || p.price_b2b || 0) * pQty);
        }, 0);
        const totalExtraCost = extraCosts.reduce((sum: number, item: any) => {
            const amt = parseFloat(item.amount) || 0;
            const qty = parseFloat(String(item.quantity).replace(',', '.')) || 0;
            return sum + (amt * qty);
        }, 0);

        const calculatedInvoiceTotal = hasWebsiteBaseAmount ? (baseLaborNum + totalExtraCost) : (productsTotal + totalExtraCost + baseLaborNum);

        const clientData = {
            title: job.title || '',
            name: job.clientName || 'Client',
            address: job.address || '',
            phone: job.clientPhone || '',
            jobId: job.id.toString(),
            date: new Date().toLocaleDateString('ro-RO'),
            products: productsArr,
            extraCosts: extraCosts,
            baseLaborPrice: baseLaborNum,
            invoiceTotal: calculatedInvoiceTotal,
            hasWebsiteBaseAmount
        };

        const serials = { internal: serialInternal, external: serialExternal };

        console.log(`[DOC API] Starting generation for JOB ${job.id}`);

        // Generate PDFs in parallel
        const attachments: Array<{ filename: string; content: Buffer }> = [];
        const timestamp = Date.now();

        try {
            if (pv) {
                console.log(`[DOC API] Rendering PV buffer...`);
                const buf = await renderToBuffer(React.createElement(DocumentTemplate, { type: 'pv', installerData, clientData, serials, signatureUrl: signature }) as any);
                attachments.push({ filename: `Proces_Verbal_${job.id}_${timestamp}.pdf`, content: buf });
                console.log(`[DOC API] PV buffer done!`);
            }
            if (garantie) {
                console.log(`[DOC API] Rendering Garantie buffer...`);
                const buf = await renderToBuffer(React.createElement(DocumentTemplate, { type: 'garantie', installerData, clientData, serials }) as any);
                attachments.push({ filename: `Garantie_${job.id}_${timestamp}.pdf`, content: buf });
                console.log(`[DOC API] Garantie buffer done!`);
            }
            if (factura) {
                console.log(`[DOC API] Rendering Factura buffer...`);
                const buf = await renderToBuffer(React.createElement(DocumentTemplate, { type: 'factura', installerData, clientData, serials }) as any);
                attachments.push({ filename: `Factura_${job.id}_${timestamp}.pdf`, content: buf });
                console.log(`[DOC API] Factura buffer done!`);
            }
        } catch (pdfErr) {
            console.error("[DOC API] Extreme PDF Rendering Crash:", pdfErr);
            throw pdfErr;
        }

        // --- NEW: Save locally and push to Metadata! ---
        const docsDir = path.join(process.cwd(), 'data', 'documents');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        const savedDocs: any[] = [];
        for (const att of attachments) {
            const filePath = path.join(docsDir, att.filename);
            fs.writeFileSync(filePath, att.content);
            const docName = att.filename.includes('Proces_Verbal') ? 'Proces Verbal' : att.filename.includes('Garantie') ? 'Certificat de Garanție' : 'Factură Fiscală';
            savedDocs.push({ name: docName, filename: att.filename, url: `/api/documents/${att.filename}` });
        }

        // Merge into current metadata
        await prisma.job.update({
            where: { id: parseInt(jobIdStr) },
            data: {
                metadata: {
                    ...jobMeta,
                    generatedDocuments: [...(jobMeta.generatedDocuments || []), ...savedDocs]
                }
            }
        });
        // ------------------------------------------------

        // Setup Nodemailer Transport 
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const clientEmail = jobMeta.email || process.env.EMAIL_USER || 'test@example.com'; 
        const adminEmail = profile.email || process.env.EMAIL_USER;

        console.log(`[DOC API] Sending email to ${clientEmail} with BCC to ${adminEmail}`);

        const mailOptions = {
            from: `"ClimaticPRO" <${process.env.EMAIL_USER}>`,
            to: clientEmail,
            bcc: adminEmail,
            subject: `Documente Lucrare #${job.id} - ClimaticPRO`,
            text: `Bună ziua ${clientData.name},\n\nAtașat găsiți documentele aferente instalării efectuate la sediul dumneavoastră.\n\nEchipă ${installerData.companyName}\nPlatforma ClimaticPRO.`,
            attachments
        };

        // Try to send email
        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error("Failed to send email:", mailError);
            return setCors(NextResponse.json({ 
                success: true, 
                message: 'Documente generate, dar emailul nu a putut fi trimis (Verificați configurările SMTP din .env).',
                generated: attachments.map(a => a.filename)
            }));
        }

        return setCors(NextResponse.json({ 
            success: true, 
            message: `Documente trimise cu succes la ${clientEmail}`,
            generated: attachments.map(a => a.filename)
        }));

    } catch (err: any) {
        console.error("PDF API Error:", err);
        return setCors(NextResponse.json({ success: false, message: 'Eroare internă', error: err.message }, { status: 500 }));
    }
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
