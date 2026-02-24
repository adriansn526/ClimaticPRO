import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Prevent static optimization during build (failed connection)

export async function POST(request: Request) {
    try {
        const prisma = getPrisma();
        const { userId, companyName, cui, regCom, bankName, iban, address, isVatPayer, warrantyInfo } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const profile = await prisma.installerProfile.upsert({
            where: { userId: String(userId) },
            update: {
                companyName,
                cui,
                regCom,
                bankName,
                iban,
                address,
                isVatPayer,
                warrantyInfo
            },
            create: {
                userId: String(userId),
                companyName,
                cui,
                regCom,
                bankName,
                iban,
                address,
                isVatPayer,
                warrantyInfo
            }
        });

        return NextResponse.json({ success: true, profile });

    } catch (error: any) {
        console.error('Installer Profile Update Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    }

    try {
        const prisma = getPrisma();
        const profile = await prisma.installerProfile.findUnique({
            where: { userId: String(userId) }
        });

        if (!profile) {
            return NextResponse.json({
                success: true,
                profile: {
                    companyName: '', cui: '', regCom: '', bankName: '', iban: '', address: '', isVatPayer: false, warrantyInfo: ''
                }
            });
        }

        return NextResponse.json({ success: true, profile });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
