import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';


export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const jobId = parseInt(params.id);
        if (isNaN(jobId)) {
            return NextResponse.json({ success: false, error: 'ID Invalid' }, { status: 400 });
        }

        let buffer: Buffer;
        let originalName = 'upload.jpg';
        let fileType = 'image/jpeg';

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json();
            if (!body.base64Data) {
                return NextResponse.json({ success: false, error: 'Lipsă date base64.' }, { status: 400 });
            }
            buffer = Buffer.from(body.base64Data, 'base64');
            originalName = body.fileName || originalName;
            fileType = body.fileType || fileType;
        } else {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            if (!file) {
                return NextResponse.json({ success: false, error: 'Niciun fișier media primit.' }, { status: 400 });
            }
            buffer = Buffer.from(await file.arrayBuffer());
            originalName = file.name || originalName;
            fileType = file.type || fileType;
        }

        const ext = path.extname(originalName) || '.jpg';
        const filename = `media_${jobId}_${Date.now()}${ext}`;
        
        const mediaDir = path.join(process.cwd(), 'data', 'media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        const filePath = path.join(mediaDir, filename);
        fs.writeFileSync(filePath, buffer);

        const prisma = getPrisma();
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) {
            return NextResponse.json({ success: false, error: 'Lucrarea nu există' }, { status: 404 });
        }

        const jobMeta: any = job.metadata || {};
        const newMediaItem = {
            url: `/api/media/${filename}`,
            name: originalName,
            type: fileType || 'image/jpeg',
            uploadedAt: new Date().toISOString()
        };

        const updatedMeta = {
            ...jobMeta,
            mediaItems: [...(jobMeta.mediaItems || []), newMediaItem]
        };

        await prisma.job.update({
            where: { id: jobId },
            data: { metadata: updatedMeta }
        });

        return NextResponse.json({ success: true, media: updatedMeta.mediaItems });
    } catch (error) {
        console.error("Failed uploading media:", error);
        return NextResponse.json({ success: false, error: 'Eroare internă' }, { status: 500 });
    }
}
