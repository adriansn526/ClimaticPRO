import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

// GET: Fetch Jobs for an Installer
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status'); // e.g., 'active' or specific status like 'pending'

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
        }

        const where: any = {
            installerId: userId
        };

        if (status === 'active') {
            // Active means not completed or cancelled
            where.status = {
                in: ['pending', 'in_progress', 'scheduled']
            };
        } else if (status) {
            where.status = status;
        }

        const jobs = await prisma.job.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform for UI
        const mappedJobs = jobs.map((job) => {
            const meta = job.metadata as any || {};

            return {
                id: job.id.toString(),
                client: job.clientName,
                address: job.address,
                phone: job.clientPhone,
                date: new Date(job.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                status: job.status,
                products: meta.products ? meta.products.map((p: any) => p.name) : []
            };
        });

        return NextResponse.json({ success: true, jobs: mappedJobs });

    } catch (error) {
        console.error("Jobs API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
    }
}
