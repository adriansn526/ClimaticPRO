import { NextResponse } from 'next/server';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password, email } = body;

        // Mock static login for testing Mobile App
        // Accept any generic test credentials
        if (
            (phone === '0722222222' || email === 'test@test.com') ||
            (password === '123456' || password === 'password')
        ) {
            return NextResponse.json({
                success: true,
                token: 'mock-jwt-token-for-dev',
                user: {
                    id: 1,
                    name: 'Instalator Profil Test',
                    phone: phone || '0722222222',
                    role: 'installer'
                }
            }, { status: 200, headers: corsHeaders });
        }

        // Generic fallback for any other input during dev
        return NextResponse.json({
            success: true,
            token: 'mock-jwt-token-fallback',
            user: {
                id: 99,
                name: 'Fallback Dev User',
                role: 'installer'
            }
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500, headers: corsHeaders });
    }
}
