import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const profile = await prisma.installerProfile.findUnique({
            where: { id }
        });

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Installer not found' }, { status: 404 });
        }

        // Fetch related entities using the profile's userId (which is the installerId in other tables)
        const teamMembers = await prisma.teamMember.findMany({
            where: { installerId: profile.userId }
        });

        const jobs = await prisma.job.findMany({
            where: { installerId: profile.userId },
            orderBy: { createdAt: 'desc' }
        });

        const stocks = await prisma.stockItem.findMany({
            where: { installerId: profile.userId },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            success: true,
            data: {
                profile,
                teamMembers,
                jobs,
                stocks
            }
        });
    } catch (error) {
        console.error('Error fetching installer details:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
        }

        const profile = await prisma.installerProfile.findUnique({
            where: { id }
        });

        if (!profile || !profile.phone) {
            return NextResponse.json({ success: false, error: 'Installer or valid phone number not found' }, { status: 404 });
        }

        // Send SMS logic using SMSO
        const SMSO_SENDER = process.env.SMSO_SENDER || 'ClimaticPRO';
        const SMSO_TOKEN = process.env.SMSO_API_KEY;

        if (!SMSO_TOKEN) {
            return NextResponse.json({ success: false, error: 'SMSO API Key is missing in environment' }, { status: 500 });
        }

        // Clean phone number for E.164 if necessary
        let toPhone = profile.phone.replace(/[^0-9]/g, '');
        if (toPhone.startsWith('0')) {
            toPhone = '40' + toPhone.substring(1);
        } else if (!toPhone.startsWith('40') && toPhone.length === 10) {
            toPhone = '40' + toPhone;
        }

        const smsPayload = {
            to: '+' + toPhone,
            sender: SMSO_SENDER,
            body: message,
        };

        const smsRes = await fetch('https://app.smso.ro/api/v1/send', {
            method: 'POST',
            headers: {
                'X-Authorization': SMSO_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(smsPayload)
        });

        const smsData = await smsRes.json();

        if (!smsRes.ok) {
            throw new Error(smsData.message || 'Eroare la trimiterea SMS-urilor via SMSO');
        }

        return NextResponse.json({ success: true, message: 'SMS trimis cu succes!', data: smsData });

    } catch (error: any) {
        console.error('Error sending SMS to installer:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const profile = await prisma.installerProfile.findUnique({ where: { id } });
        if (!profile) {
            return NextResponse.json({ success: false, error: 'Installer not found' }, { status: 404 });
        }

        // Delete associated team members, jobs and stocks to keep DB clean (Optional but good practice)
        await prisma.teamMember.deleteMany({ where: { installerId: profile.userId } });
        // Optionally unassign jobs rather than deleting them, or delete them if preferred. We'll leave jobs for historical but delete the profile.
        // Actually, let's just delete the profile.

        await prisma.installerProfile.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Installer deleted successfully' });
    } catch (error) {
        console.error('Error deleting installer:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { premiumType, premiumValue } = body;

        const updatedProfile = await prisma.installerProfile.update({
            where: { id },
            data: {
                premiumType: premiumType || null,
                premiumValue: premiumValue != null ? parseFloat(premiumValue) : null,
            }
        });

        return NextResponse.json({ success: true, message: 'Premium pricing updated successfully!', data: updatedProfile });
    } catch (error) {
        console.error('Error updating premium config:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
