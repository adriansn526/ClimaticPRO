import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request, { params }: { params: { filename: string } }) {
    try {
        if (!params.filename) {
            return new NextResponse('Filename is required', { status: 400 });
        }

        const safeFilename = params.filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const filePath = path.join(process.cwd(), 'data', 'media', safeFilename);

        if (!fs.existsSync(filePath)) {
            return new NextResponse('Media not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        // Determine content type based on extension
        const ext = path.extname(safeFilename).toLowerCase();
        let contentType = 'application/octet-stream';
        
        switch (ext) {
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.webp':
                contentType = 'image/webp';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.mp4':
                contentType = 'video/mp4';
                break;
            case '.mov':
                contentType = 'video/quicktime';
                break;
        }

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        console.error('Error streaming media file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
