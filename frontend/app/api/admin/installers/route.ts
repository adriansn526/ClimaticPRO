import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        // Fetch all profiles that have started onboarding
        const profiles = await prisma.installerProfile.findMany({
            where: {
                companyName: {
                    not: 'Necunoscut'
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formatted = profiles.map(p => ({
            id: p.id.toString(),
            name: p.name || p.companyName || 'N/A',
            email: p.email || 'N/A',
            phone: p.phone || p.userId || 'N/A',
            zone: p.address || 'Zonă nespecificată',
            status: p.status, // "pending", "approved", "rejected", "suspended"
            rating: 5.0, // Placeholder for future rating system
            isAutoAssignEnabled: p.isAutoAssignEnabled,
            isInternal: p.isInternal,
            dailyCapacity: p.dailyCapacity || 3
        }));

        return NextResponse.json({ success: true, installers: formatted });
    } catch (error) {
        console.error('Error fetching admin installers:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { installerId, action } = body;

        if (!installerId || !action) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'toggle_auto_assign') {
            const newValue = body.value === true;
            if (newValue) {
                // Ensure only 1 auto-assign active
                await prisma.installerProfile.updateMany({
                    where: { isAutoAssignEnabled: true },
                    data: { isAutoAssignEnabled: false }
                });
            }
            const updated = await prisma.installerProfile.update({
                where: { id: parseInt(installerId) },
                data: { isAutoAssignEnabled: newValue }
            });
            return NextResponse.json({ success: true, installer: updated });
        }

        if (action === 'toggle_internal') {
            const newValue = body.value === true;
            const updated = await prisma.installerProfile.update({
                where: { id: parseInt(installerId) },
                data: { isInternal: newValue }
            });
            return NextResponse.json({ success: true, installer: updated });
        }

        if (action === 'update_capacity') {
            const newValue = parseInt(body.value);
            if (isNaN(newValue) || newValue < 0) return NextResponse.json({ success: false, error: 'Invalid capacity' }, { status: 400 });
            const updated = await prisma.installerProfile.update({
                where: { id: parseInt(installerId) },
                data: { dailyCapacity: newValue }
            });
            return NextResponse.json({ success: true, installer: updated });
        }

        let newStatus = '';
        if (action === 'approve') newStatus = 'approved';
        else if (action === 'reject') newStatus = 'rejected';
        else if (action === 'suspend') newStatus = 'suspended';
        else return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

        const updated = await prisma.installerProfile.update({
            where: { id: parseInt(installerId) },
            data: { status: newStatus }
        });

        return NextResponse.json({ success: true, installer: updated });
    } catch (error) {
        console.error('Error updating installer status:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
