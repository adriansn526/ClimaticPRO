import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

// Helper to verify JWT from headers
function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as any;
    } catch (e) {
        return null;
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 });
        }

        const jobId = parseInt(params.id);
        if (isNaN(jobId)) {
            return NextResponse.json({ success: false, message: 'ID invalid' }, { status: 400 });
        }

        const body = await request.json();
        const { reason } = body;

        if (!reason) {
            return NextResponse.json({ success: false, message: 'Motiv obligatoriu' }, { status: 400 });
        }

        // Verify job belongs to installer before cancelling
        const job = await prisma.job.findUnique({
            where: { id: jobId }
        });

        if (!job || job.installerId !== user.userId) {
            return NextResponse.json({ success: false, message: 'Lucrare inexistentă sau neasociată' }, { status: 404 });
        }

        // Update Job Status and save the reason in metadata
        const currentMeta = (job.metadata as any) || {};

        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'cancelled',
                metadata: {
                    ...currentMeta,
                    cancelReason: reason,
                    cancelledAt: new Date().toISOString()
                }
            }
        });

        // Optional logic here: Sync status to WooCommerce or broadcast order again
        // For now, updating the local Job DB is enough.

        return NextResponse.json({ success: true, job: updatedJob });

    } catch (error) {
        console.error("Mobile Job Cancel API Error:", error);
        return NextResponse.json({ success: false, error: 'Eroare server' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
