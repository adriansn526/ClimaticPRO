import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-keep-safe-in-prod';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;

        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const { companyName, cui, regCom, address, county, basePrice12k, basePrice18k, basePrice24k, coverageRegions, name, email } = await req.json();

        // 1. Update Profile
        const profile = await prisma.installerProfile.update({
            where: { userId: decoded.userId },
            data: {
                name,
                email,
                companyName,
                cui,
                regCom,
                address,
                county,
                basePrice12k: parseFloat(basePrice12k) || 0,
                basePrice18k: parseFloat(basePrice18k) || 0,
                basePrice24k: parseFloat(basePrice24k) || 0,
                coverageRegions: JSON.stringify(coverageRegions),
                status: 'pending' // Still requires admin manual strict approval if needed, but app considers onboarding complete
            }
        });

        // 2. Clear Old Demos (to prevent spam if API is called again)
        await prisma.job.deleteMany({
            where: {
                installerId: decoded.userId,
                clientName: 'Sistem DEMO ClimaticPRO'
            }
        });

        // 3. Generate Demo Job
        const demoJob = await prisma.job.create({
            data: {
                title: 'Instalare Aer Condiționat (LUCRARE DEMO)',
                clientName: 'Sistem DEMO ClimaticPRO',
                clientPhone: '0700000000',
                address: 'București, Str. Exemplului Nr. 12 (Aceasta e o lucrare demonstrativă)',
                status: 'pending', // Pending correctly shows up in active jobs filter!
                installerId: decoded.userId,
                isManual: true,
                metadata: {
                    isDemo: true,
                    amount: profile.basePrice12k || 450,
                    priceLabor: profile.basePrice12k || 450,
                    products: [
                        { name: 'APARAT DE AER CONDITIONAT MULTI-SPLIT (DEMO)', quantity: 1, price: 0 }
                    ],
                    extraCosts: [],
                    generatedDocuments: []
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Onboarding complet. Lucrare Demo alocată!',
            demoJobId: demoJob.id,
            user: {
                userId: profile.userId,
                isOnboardingComplete: true,
                isCompleted: true, // fallback
                role: 'installer',
                isInternal: !!profile.isInternal,
                coverageRegions,
                region: profile.county || '',
                address: profile.address || '',
                companyName: profile.companyName || '',
                name: profile.name || '',
                email: profile.email || ''
            }
        });

    } catch (error) {
        console.error('Error in onboarding complete:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
