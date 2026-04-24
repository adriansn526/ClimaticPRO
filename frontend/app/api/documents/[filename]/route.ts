import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: any) {
    try {
        const { params } = context;
        const filename = params.filename as string;

        if (!filename || !filename.endsWith('.pdf')) {
            return new NextResponse('Fișier invalid', { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'data', 'documents', filename);

        if (!fs.existsSync(filePath)) {
            return new NextResponse('Fișier inexistent', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`
            }
        });
    } catch (err: any) {
        console.error("Doc Stream Error:", err);
        return new NextResponse('Eroare internă', { status: 500 });
    }
}
