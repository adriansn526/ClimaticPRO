import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Helper function to set CORS headers properly so Mobile App doesn't get blocked
    const response = NextResponse.json({
        success: true,
        // BUMP THE VERSION HERE WHEN COMPILING A NEW APK
        version: '1.1.43', 
        mandatory: false, 
        apkUrl: 'https://climaticpro.ro/apk/ClimaticPRO_v1.1.43.apk',
        releaseNotes: '✓ Nou modul Gestiune Stocuri integrat\n✓ OCR cu inteligență artificială (scanare automată facturi/bonuri)\n✓ Deductie automată a stocurilor în rețetar (Phase 3 complet)'
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return response;
}

// Handle CORS Preflight requests
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
    });
}
