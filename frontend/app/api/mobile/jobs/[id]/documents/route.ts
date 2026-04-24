import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const prisma = getPrisma();
        const jobId = parseInt(params.id);
        const { url } = await request.json();

        if (isNaN(jobId) || !url) {
            return NextResponse.json({ success: false, error: 'Date invalide' }, { status: 400 });
        }

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) {
            return NextResponse.json({ success: false, error: 'Lucrarea nu există' }, { status: 404 });
        }

        const metadata = (job.metadata as any) || {};
        const oldDocs = metadata.generatedDocuments || [];

        // Remove the specific document from the JSON list
        const updatedDocs = oldDocs.filter((d: any) => d.url !== url);
        metadata.generatedDocuments = updatedDocs;

        // Save updated list to the database
        await prisma.job.update({
            where: { id: jobId },
            data: { metadata }
        });

        // Also purge the local file from storage /data/documents to free NVMe Space
        try {
            const filename = url.split('/').pop();
            if (filename) {
                const filePath = path.join(process.cwd(), 'data', 'documents', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (e) {
            console.error('Core file deletion swept:', e);
        }

        return NextResponse.json({ success: true, documents: updatedDocs });
    } catch (error) {
        console.error('Failed deleting document PDF:', error);
        return NextResponse.json({ success: false, error: 'Eroare internă server' }, { status: 500 });
    }
}
