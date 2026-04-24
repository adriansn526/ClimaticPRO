import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-keep-safe-in-prod';

export async function GET(req: Request) {
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

        const profile = await prisma.installerProfile.findUnique({
            where: { userId: decoded.userId }
        });

        if (!profile) {
            return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
        }

        // Check if Onboarding is fundamentally completed
        // Need CUI and Base Pricing, and some location
        const hasCompany = profile.cui && profile.cui.trim() !== '' && profile.companyName && profile.companyName !== 'Necunoscut';
        const hasPricing = profile.basePrice12k !== null;
        const hasLocation = profile.coverageRegions && profile.coverageRegions !== '[]';

        const isOnboardingComplete = Boolean(hasCompany && hasPricing && hasLocation);

        let parsedRegions = [];
        if (profile.coverageRegions) {
            try { parsedRegions = JSON.parse(profile.coverageRegions); } catch (e) { }
        }

        return NextResponse.json({
            success: true,
            user: {
                userId: profile.userId,
                isOnboardingComplete,
                isCompleted: isOnboardingComplete, // fallback for legacy code
                role: decoded.role || 'installer',
                isInternal: !!profile.isInternal,
                coverageRegions: parsedRegions,
                region: profile.county || '',
                address: profile.address || '',
                companyName: profile.companyName || '',
                name: profile.name || '',
                email: profile.email || ''
            }
        });
    } catch (error) {
        console.error('Error fetching auth/me:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
