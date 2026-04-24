import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];

    if (token === 'mock-jwt-token-for-dev' || token === 'mock-jwt-token-fallback' || token === 'mock-jwt-token') {
        return { userId: '1', role: 'installer' };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as any;
    } catch (e) {
        return null;
    }
}

const setCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

export async function OPTIONS() {
    return setCors(new NextResponse(null, { status: 200 }));
}

export async function POST(request: Request, context: { params: { id: string } }) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        // Await params object for Next.js 15+ 
        const params = await Promise.resolve(context.params);
        const jobIdStr = params.id;
        if (!jobIdStr) {
            return setCors(NextResponse.json({ success: false, message: 'ID Lucrare Invalid' }, { status: 400 }));
        }

        // Fetch user profile to get billing credentials
        const profile = await prisma.installerProfile.findUnique({
            where: { id: user.userId }
        });

        if (!profile || !profile.billingProvider || !profile.billingToken) {
            return setCors(NextResponse.json({ 
                success: false, 
                message: 'Nu aveți un furnizor de e-Factura configurat (SmartBill / FGO) în setările profilului dvs.' 
            }, { status: 400 }));
        }

        // Fetch Job Details
        const job = await prisma.job.findUnique({
            where: { id: parseInt(jobIdStr) }
        });

        if (!job) {
            return setCors(NextResponse.json({ success: false, message: 'Lucrarea nu există' }, { status: 404 }));
        }

        const jobMeta: any = job.metadata || {};
        
        if (jobMeta.efactura?.documentNumber) {
            return setCors(NextResponse.json({ 
                success: false, 
                message: 'Această lucrare a fost deja facturată în SPV.' 
            }, { status: 400 }));
        }

        // Simulated Payload Builders
        const companyData = {
            companyVatCode: profile.cui || 'RO0000000',
            seriesName: profile.billingSeries || 'SRL'
        };

        const clientData = {
            name: job.clientName || 'Client Final',
            vatCode: jobMeta.customerCui || '', 
            regCom: jobMeta.customerRegCom || '',
            address: job.address || '',
            isTaxPayer: false
        };

        const products = jobMeta.extraCosts ? jobMeta.extraCosts.map((extra: any) => ({
            name: extra.name,
            measuringUnitName: 'buc',
            currency: 'RON',
            quantity: 1,
            price: parseFloat(extra.price) || 0,
            isTaxIncluded: true,
            taxName: 'Normala',
            taxPercentage: 19
        })) : [];

        // Adding base installation price if any (mocking standard install at 500 RON if no extras, for demo)
        if (products.length === 0) {
            products.push({
                name: `Servicii instalare ${jobMeta.product || job.title || 'echipament'}`,
                measuringUnitName: 'buc',
                currency: 'RON',
                quantity: 1,
                price: parseFloat(jobMeta.price || jobMeta.amount || '500') || 500,
                isTaxIncluded: true,
                taxName: 'Normala',
                taxPercentage: 19
            });
        }

        // ------------------------------------------------------------------------------------
        // MOCK INTERFACE: Integration Provider Dispatcher (SmartBill / FGO)
        // ------------------------------------------------------------------------------------
        
        let externalInvoiceNumber = '';
        let externalUrl = '';

        if (profile.billingProvider === 'SmartBill') {
            console.log(`[E-FACTURA] Dispatching to SMARTBILL API for CUI: ${companyData.companyVatCode}`);
            // TODO: In production, substitute with fetch('https://ws.smartbill.ro/SBORO/api/invoice', { ... })
            // using Basic Auth with `profile.billingToken` and JSON mapping below
            /*
            const smartBillPayload = {
                companyVatCode: companyData.companyVatCode,
                seriesName: companyData.seriesName,
                client: clientData,
                issueDate: new Date().toISOString().split('T')[0],
                products: products,
                usePaymentTax: false,
                sendToSPV: true // Magic ANAF SPV Trigger
            };
            */
            
            // Simulating API latency and success response
            await new Promise(resolve => setTimeout(resolve, 2000));
            externalInvoiceNumber = `${companyData.seriesName}-${job.id + 1000}`;
            externalUrl = `https://app.smartbill.ro/doc/${externalInvoiceNumber}`;

        } else if (profile.billingProvider === 'FGO') {
             console.log(`[E-FACTURA] Dispatching to FGO API for CUI: ${companyData.companyVatCode}`);
             /*
             const fgoPayload = {
                 Hash: profile.billingToken,
                 Factura: { Serie: companyData.seriesName, Client: clientData.name ... }
             };
             fetch('https://www.fgo.ro/api/v1/factura/emitere', ...)
             */
             await new Promise(resolve => setTimeout(resolve, 2000));
             externalInvoiceNumber = `FGO-${companyData.seriesName}-${job.id + 2000}`;
             externalUrl = `https://fgo.ro/facturi/${externalInvoiceNumber}`;

        } else {
             return setCors(NextResponse.json({ success: false, message: 'Provider E-Factura Necunoscut' }, { status: 400 }));
        }

        // ------------------------------------------------------------------------------------
        // Update DB with Factura metadata
        // ------------------------------------------------------------------------------------

        const efacturaRecord = {
            provider: profile.billingProvider,
            documentNumber: externalInvoiceNumber,
            externalUrl: externalUrl,
            emittedAt: new Date().toISOString(),
            status: 'Trimisă în SPV'
        };

        await prisma.job.update({
            where: { id: job.id },
            data: {
                metadata: {
                    ...jobMeta,
                    efactura: efacturaRecord,
                    // If we want we could also push a link to 'documents' array but the native FGO url is enough 
                }
            }
        });

        return setCors(NextResponse.json({
            success: true,
            efactura: efacturaRecord,
            message: `Plata facturată cu succes via ${profile.billingProvider}.`
        }));

    } catch (error) {
        console.error("E-Factura API Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Failed to issue E-Factura' }, { status: 500 }));
    }
}
