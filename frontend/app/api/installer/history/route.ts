import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
        }

        // Fetch completed jobs for this installer
        // We can also support filters here if needed (startDate, endDate)
        const jobs = await prisma.job.findMany({
            where: {
                installerId: userId,
                // status: 'completed' // Optional: if we only want completed in history
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform for UI
        const history = jobs.map((job) => {
            const meta = job.metadata as any || {};

            // Calculate extra totals if stored in metadata
            // 'extraVerifiedItems' contains the pipe/console data from Step 1
            const extraItems = meta.extraVerifiedItems || [];

            const extraTotal = meta.finalTotal || 0; // Use the saved final total from invoice

            const extraPipe = extraItems
                .filter((i: any) => i.name.toLowerCase().includes('traseu'))
                .reduce((acc: number, i: any) => acc + (parseFloat(i.qty) || 0), 0);

            return {
                id: job.id.toString(), // DB ID
                jobId: job.id,
                date: new Date(job.createdAt).toLocaleDateString('ro-RO'),
                client: job.clientName,
                location: job.address,
                products: meta.products ? meta.products.map((p: any) => p.name) : [],
                extra: {
                    pipe: extraPipe,
                    total: extraTotal
                },
                status: job.status
            };
        });

        return NextResponse.json({ success: true, jobs: history });

    } catch (error) {
        console.error("History API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
    }
}
