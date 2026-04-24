import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, context: any) {
    const { params } = context;
    const filename = params.filename;

    if (!filename || typeof filename !== 'string') {
        return new NextResponse('Nume document lipsă', { status: 400 });
    }

    // Directory mapped to Docker Volume
    const filePath = path.join(process.cwd(), 'data', 'documents', 'b2b', filename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse('Documentul nu a fost găsit', { status: 404 });
    }

    try {
        const fileBuffer = await fs.promises.readFile(filePath);
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (e) {
        console.error('Error reading PDF file:', e);
        return new NextResponse('Eroare internă', { status: 500 });
    }
}
