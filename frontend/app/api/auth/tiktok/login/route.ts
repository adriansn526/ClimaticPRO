import { NextResponse } from 'next/server';

export async function GET() {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://climaticpro.ro';
    const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;

    if (!clientKey) {
        return NextResponse.json({ error: 'TikTok Client Key not configured' }, { status: 500 });
    }

    const csrfState = Math.random().toString(36).substring(2);

    const params = new URLSearchParams({
        client_key: clientKey,
        response_type: 'code',
        scope: 'user.info.basic,video.publish,video.upload',
        redirect_uri: redirectUri,
        state: csrfState,
    });

    const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    return NextResponse.redirect(url);
}
