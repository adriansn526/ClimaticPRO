import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123') as any;
    } catch {
        return null;
    }
}

export async function POST(request: Request, context: any) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }

        const { id } = context.params;
        if (!id) return NextResponse.json({ success: false, message: 'ID invalid' }, { status: 400 });

        const prisma = getPrisma();

        let reqBody: any = {};
        try {
            // Because previous implementations didn't send a body to this route, we make it safe
            reqBody = await request.clone().json();
        } catch(e) {}

        const extraMaterials = reqBody.extraMaterials || [];

        // Check if job exists
        const job = await prisma.job.findUnique({ where: { id: parseInt(id) } });
        if (!job) {
            return NextResponse.json({ success: false, message: 'Lucrarea nu există' }, { status: 404 });
        }

        // Only allowing installer to complete their own job
        if (job.installerId !== user.userId && job.installerId !== user.id?.toString()) {
            return NextResponse.json({ success: false, message: 'Nu ai acces la această lucrare' }, { status: 403 });
        }

        const updatedJob = await prisma.job.update({
            where: { id: parseInt(id) },
            data: { 
                status: 'completed' 
            }
        });

        // --- AUTOMATED STOCK DEDUCTION LOGIC ---
        try {
            const metaObj = job.metadata as any || {};
            const productsList = metaObj.products || [];
            const fullConsumptionList = [...productsList, ...extraMaterials];
            
            // Check if installer is internally managed to deduct stocks
            const installerProfile = await prisma.installerProfile.findUnique({
                where: { userId: job.installerId }
            });
            
            if (installerProfile?.isInternal && fullConsumptionList.length > 0) {
                for (const item of fullConsumptionList) {
                    const parsedQty = parseFloat(String(item.quantity).replace(',', '.'));
                    if (isNaN(parsedQty) || parsedQty <= 0) continue;
                    const normalizedName = String(item.name).trim();
                    if (!normalizedName) continue;

                    // Do not deduct "Servicii" implicitly. Check if it exists in stock. 
                    const stockItem = await prisma.stockItem.findUnique({
                        where: {
                            installerId_name: {
                                installerId: job.installerId,
                                name: normalizedName
                            }
                        }
                    });

                    if (stockItem) {
                        await prisma.stockItem.update({
                            where: { id: stockItem.id },
                            data: { stock: stockItem.stock - parsedQty }
                        });

                        await prisma.stockTransaction.create({
                            data: {
                                installerId: job.installerId,
                                stockItemId: stockItem.id,
                                type: 'out',
                                quantity: parsedQty,
                                source: `job_${job.id}`
                            }
                        });
                    }
                }
            }
        } catch (stockErr) {
            console.error('[Stock Deduction] Error processing stock:', stockErr);
        }
        // --- END AUTOMATED STOCK DEDUCTION LOGIC ---

        // --- AUTOMATED REVIEWS LOGIC ---
        try {
            const settings = await prisma.appSetting.findMany({
                where: {
                    key: { in: ['GOOGLE_REVIEW_URL', 'REVIEW_DELIVERY_METHOD'] }
                }
            });
            const settingsMap: Record<string, string> = {};
            settings.forEach(s => settingsMap[s.key] = s.value);

            const googleUrl = settingsMap['GOOGLE_REVIEW_URL'];
            const devMethod = settingsMap['REVIEW_DELIVERY_METHOD'] || 'email';

            if (googleUrl && googleUrl.trim() !== '') {
                const clientPhone = job.clientPhone;
                const clientName = job.clientName.split(' ')[0] || 'Client';
                const clientEmail = (job.metadata as any)?.email;

                // SMS Logic removed per request

                // Email Logic
                if (devMethod === 'email' || devMethod === 'both') {
                    if (clientEmail) {
                        const metaObj = job.metadata as any || {};
                        const productsList = metaObj.products ? metaObj.products.map((p: any) => p.name || p).join(', ') : 'Echipamente/Servicii conform programării';
                        const generatedDocs = metaObj.generatedDocuments || [];
                        
                        const docsHtml = generatedDocs.length > 0 
                            ? generatedDocs.map((doc: any) => `<a href="https://climaticpro.ro${doc.url || doc}" style="display: inline-block; margin: 4px; background-color: #F8FAFC; color: #1E293B; text-decoration: none; padding: 10px 15px; border-radius: 6px; font-weight: bold; font-size: 14px; border: 1px solid #CBD5E1;">📎 ${doc.type === 'pv' ? 'Proces Verbal' : doc.type === 'factura' ? 'Factură' : doc.type === 'garantie' ? 'Garanție' : 'Vezi Document'}</a>`).join('')
                            : `<p style="font-size: 14px; color: #64748b; background-color: #F8FAFC; padding: 10px; border-radius: 6px; border: 1px dashed #CBD5E1;">Documentele aferente au fost înmânate fizic sau vor fi sincronizate curând în platformă.</p>`;

                        const { sendGenericEmail } = require('@/lib/email');
                        const html = `
                            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
                                <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #F3F4F6;">
                                    <h2 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800;">Documentație atașată 📝</h2>
                                </div>
                                <p style="font-size: 16px; color: #111827; margin-bottom: 12px;">Bună ziua, <strong>${clientName}</strong>,</p>
                                <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin-bottom: 16px;">
                                    Vă mulțumim pentru încrederea acordată echipei <strong>ClimaticPRO</strong>! Ne bucurăm că am finalizat cu succes proiectul dumneavoastră. Au fost efectuate următoarele:
                                </p>
                                <div style="background-color: #ECFDF5; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;">
                                    <p style="color: #047857; font-weight: 600; margin: 0; font-size: 14px;">🛠️ ${productsList}</p>
                                </div>
                                
                                <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin-bottom: 16px;">
                                    Pentru a păstra totul transparent și organizat, regăsiți atașate acestui e-mail documentele oficiale aferente lucrării <em>(vă recomandăm să le salvați pentru o evidență mai ușoară pe viitor)</em>:
                                </p>
                                <div style="margin-bottom: 24px;">
                                    ${docsHtml}
                                </div>

                                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                                    <h3 style="color: #111827; margin-top: 0; margin-bottom: 12px;">Cum a fost experiența dumneavoastră cu noi? 🌟</h3>
                                    <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin-bottom: 20px;">
                                        Misiunea noastră este să oferim servicii de cea mai înaltă calitate, iar părerea clienților noștri este cel mai bun instrument de validare a eforturilor noastre.<br><br>
                                        V-am fi recunoscători dacă ați aloca 1 minut pentru a ne lăsa o recenzie:
                                    </p>
                                    <a href="${googleUrl}" style="background-color: #2563EB; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                                        Lasă-ne o Recenzie pe Google
                                    </a>
                                </div>
                                
                                <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin-bottom: 8px;">
                                    Vă stăm la dispoziție pe viitor pentru mentenanță sau orice alte solicitări tehnice. Să vă bucurați de un climat perfect!
                                </p>
                                <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin-bottom: 0;">
                                    Toate cele bune,<br/>
                                    <strong>Echipa ClimaticPRO</strong>
                                </p>
                                
                                <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 32px; border-top: 1px solid #F3F4F6; padding-top: 20px;">
                                    © ${new Date().getFullYear()} ClimaticPRO. Toate drepturile rezervate.<br/>
                                    Acesta este un mesaj automat generat de platforma noastră.
                                </p>
                            </div>
                        `;
                        await sendGenericEmail({
                            to: clientEmail,
                            subject: 'Finalizare lucrare și Documentație atașată - ClimaticPRO',
                            html
                        });
                        console.log(`[Review] Email sent to ${clientEmail}`);
                    }
                }
            }
        } catch (reviewErr) {
            console.error('[Review] Error processing automated reviews:', reviewErr);
        }
        // --- END AUTOMATED REVIEWS LOGIC ---

        return NextResponse.json({ success: true, message: 'Lucrare finalizată cu succes!', job: updatedJob });
    } catch (error) {
        console.error('Job Complete Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare internă server' }, { status: 500 });
    }
}
