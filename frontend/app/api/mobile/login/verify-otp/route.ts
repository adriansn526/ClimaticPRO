import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-keep-safe-in-prod';

export async function POST(req: Request) {
    try {
        const { phone, code } = await req.json();

        if (!phone || !code) {
            return NextResponse.json({ message: 'Phone and code are required' }, { status: 400 });
        }

        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('40') && cleanPhone.length === 11) {
            cleanPhone = '+' + cleanPhone;
        } else if (cleanPhone.startsWith('0')) {
            cleanPhone = '+40' + cleanPhone.substring(1);
        }

        // 1. Verify OTP
        console.log(`[VERIFY DEBUG] Incoming Request: ${phone} | Code: ${code}`);
        console.log(`[VERIFY DEBUG] Cleaned Phone for DB search: ${cleanPhone}`);

        const otpRecord = await prisma.otpVerification.findUnique({
            where: { phone: cleanPhone }
        });

        if (!otpRecord) {
            console.log(`[VERIFY DEBUG] ❌ No OTP found for ${cleanPhone}`);
            return NextResponse.json({ message: 'No OTP found for this number' }, { status: 400 });
        }

        console.log(`[VERIFY DEBUG] DB Record Found: Code=${otpRecord.code}, ExpiresAt=${otpRecord.expiresAt}`);

        if (otpRecord.code !== code.toString()) {
            console.log(`[VERIFY DEBUG] ❌ Code Mismatch! Expected ${otpRecord.code}, got ${code.toString()}`);
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }

        if (new Date() > otpRecord.expiresAt) {
            console.log(`[VERIFY DEBUG] ❌ OTP Expired! Now: ${new Date().toISOString()} > Exp: ${otpRecord.expiresAt.toISOString()}`);
            return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
        }

        // OTP is valid. 
        // 2. Check if the user is a TeamMember for an existing firm
        const teamMember = await prisma.teamMember.findFirst({
            where: { phone: cleanPhone }
        });

        let profile;
        let isCompleted = false;

        if (teamMember) {
            // Activate team member if it was pending
            if (teamMember.status === 'pending') {
                await prisma.teamMember.update({
                    where: { id: teamMember.id },
                    data: { status: 'active' }
                });
            }

            profile = await prisma.installerProfile.findUnique({
                where: { userId: teamMember.installerId }
            });

            if (!profile) {
                return NextResponse.json({ message: 'Eroare: Compania părinte nu mai există.' }, { status: 400 });
            }

            isCompleted = profile.companyName !== 'Necunoscut';
        } else {
            // Normal flow: Check if own InstallerProfile exists
            profile = await prisma.installerProfile.findFirst({
                where: { userId: cleanPhone }
            });

            if (!profile) {
                // User doesn't exist. Create a mock profile that needs completion.
                profile = await prisma.installerProfile.create({
                    data: {
                        userId: cleanPhone,
                        companyName: 'Necunoscut', // Indicator that it needs completion
                    }
                });
            }
            isCompleted = profile.companyName !== 'Necunoscut';
        }

        // 3. Remove OTP record to prevent reuse
        await prisma.otpVerification.delete({
            where: { id: otpRecord.id }
        });

        // 4. Issue JWT Token (For TeamMembers, use the parent's userId & installerId)
        const token = jwt.sign(
            {
                userId: profile.userId,
                installerId: profile.id,
                isCompleted,
                role: teamMember ? teamMember.role : 'installer',
                teamMemberId: teamMember ? teamMember.id : null,
                ownPhone: cleanPhone
            },
            JWT_SECRET,
            { expiresIn: '30d' } // Stay logged in for 30 days
        );

        let parsedRegions = [];
        if (profile.coverageRegions) {
            try { parsedRegions = JSON.parse(profile.coverageRegions); } catch (e) { }
        }

        // Check onboarding completion
        const hasCompany = profile.cui && profile.cui.trim() !== '' && profile.companyName && profile.companyName !== 'Necunoscut';
        const hasPricing = profile.basePrice12k !== null;
        const hasLocation = profile.coverageRegions && profile.coverageRegions !== '[]';
        const isOnboardingComplete = Boolean(hasCompany && hasPricing && hasLocation);

        return NextResponse.json({
            message: 'Login successful',
            token,
            user: {
                userId: profile.userId,
                isCompleted,
                isOnboardingComplete,
                role: teamMember ? teamMember.role : 'installer',
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
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
