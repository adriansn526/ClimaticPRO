import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing ID' }, { status: 400 });
        }

        const job = await prisma.job.findUnique({
            where: { id: parseInt(id) }
        });

        if (!job) {
            return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
        }

        // Parse Metadata
        const meta = job.metadata as any || {};

        const formattedJob = {
            id: job.id.toString(),
            client: job.clientName,
            address: job.address,
            phone: job.clientPhone || '-',
            email: meta.email || '',
            date: new Date(job.createdAt).toLocaleDateString('ro-RO'),
            status: job.status,
            products: meta.products || [],
            // Other data could be here (verified items, invoice, etc if saved)
        };

        return NextResponse.json({ success: true, job: formattedJob });

    } catch (error) {
        console.error("Job API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch job' }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing ID' }, { status: 400 });
        }

        const jobId = parseInt(id);

        // Fetch existing job to merge metadata if needed, but for now we might overwrite or merge
        const existingJob = await prisma.job.findUnique({ where: { id: jobId } });

        if (!existingJob) {
            return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
        }

        const currentMeta = existingJob.metadata as any || {};

        // Merge existing metadata with new updates (e.g. products list should theoretically stay, but we might want to update verified status)
        // Body should contain: { status, data: { verifiedProducts, serials, invoiceItems, extraItems } }

        const updatedMeta = {
            ...currentMeta,
            ...body.data, // Merge new data (serials, invoice, etc)
            updatedAt: new Date().toISOString()
        };

        const updateData: any = {
            metadata: updatedMeta,
        };

        if (body.status) {
            updateData.status = body.status;
        }

        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: updateData
        });

        return NextResponse.json({ success: true, job: updatedJob });

    } catch (error) {
        console.error("Job Update Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 });
    }
}
