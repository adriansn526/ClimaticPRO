import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const csvPath = '/home/asns/ClimaticPRO/campanie_sms_primavara.csv';

    if (!fs.existsSync(csvPath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    const fileStream = fs.createReadStream(csvPath) as any;

    return new NextResponse(fileStream, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="campanie_sms_primavara.csv"',
        },
    });
}
