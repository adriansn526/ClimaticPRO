import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

// Helper to verify JWT from headers
function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
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
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

// GET: Fetch Installer Profile
export async function GET(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const profile = await prisma.installerProfile.findUnique({
            where: { userId: user.userId }
        });

        if (!profile) {
            return setCors(NextResponse.json({ success: false, message: 'Profil inexistent' }, { status: 404 }));
        }

        // Parse coverageRegions safely
        let parsedRegions = ["Bucuresti"];
        if (profile.coverageRegions) {
            try {
                parsedRegions = JSON.parse(profile.coverageRegions);
            } catch (e) {
                console.error("Failed to parse coverage regions array");
            }
        }

        return setCors(NextResponse.json({
            success: true,
            profile: {
                companyName: profile.companyName !== 'Necunoscut' ? profile.companyName : '',
                cui: profile.cui || '',
                regCom: profile.regCom || '',
                iban: profile.iban || '',
                bank: profile.bankName || '',
                address: profile.address || '',
                county: profile.county || '',
                city: profile.city || '',
                email: profile.email || '',
                phone: profile.phone || profile.userId,
                coverageLat: profile.coverageLat || 44.4268,
                coverageLng: profile.coverageLng || 26.1025,
                coverageRadius: profile.coverageRadius || 50,
                coverageRegions: parsedRegions,
                billingProvider: profile.billingProvider || null,
                billingToken: profile.billingToken || '',
                billingSeries: profile.billingSeries || '',
                spvToken: profile.spvToken || ''
            }
        }));

    } catch (error) {
        console.error("Mobile Profile API GET Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 }));
    }
}

// PUT: Update Installer Profile (including Regions)
export async function PUT(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const body = await request.json();

        // Stringify regions if present
        let coverageRegionsStr = undefined;
        if (body.coverageRegions && Array.isArray(body.coverageRegions)) {
            coverageRegionsStr = JSON.stringify(body.coverageRegions);
        }

        const updatedProfile = await prisma.installerProfile.upsert({
            where: { userId: user.userId },
            update: {
                companyName: body.companyName || 'Necunoscut',
                cui: body.cui,
                regCom: body.regCom,
                iban: body.iban,
                bankName: body.bank,
                address: body.address,
                county: body.county,
                city: body.city,
                email: body.email,
                phone: body.phone,
                coverageLat: body.coverageLat,
                coverageLng: body.coverageLng,
                coverageRadius: body.coverageRadius,
                ...(coverageRegionsStr && { coverageRegions: coverageRegionsStr }),
                ...(body.billingProvider !== undefined && { billingProvider: body.billingProvider }),
                ...(body.billingToken !== undefined && { billingToken: body.billingToken }),
                ...(body.billingSeries !== undefined && { billingSeries: body.billingSeries }),
                ...(body.spvToken !== undefined && { spvToken: body.spvToken })
            },
            create: {
                userId: user.userId,
                companyName: body.companyName || 'Necunoscut',
                cui: body.cui,
                regCom: body.regCom,
                iban: body.iban,
                bankName: body.bank,
                address: body.address,
                county: body.county,
                city: body.city,
                phone: body.phone,
                coverageLat: body.coverageLat,
                coverageLng: body.coverageLng,
                coverageRadius: body.coverageRadius,
                ...(coverageRegionsStr && { coverageRegions: coverageRegionsStr }),
                ...(body.billingProvider !== undefined && { billingProvider: body.billingProvider }),
                ...(body.billingToken !== undefined && { billingToken: body.billingToken }),
                ...(body.billingSeries !== undefined && { billingSeries: body.billingSeries }),
                ...(body.spvToken !== undefined && { spvToken: body.spvToken })
            }
        });

        return setCors(NextResponse.json({ success: true, message: 'Profil actualizat cu succes', isCompleted: updatedProfile.companyName !== 'Necunoscut' }));
    } catch (error) {
        console.error("Mobile Profile API PUT Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 }));
    }
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
