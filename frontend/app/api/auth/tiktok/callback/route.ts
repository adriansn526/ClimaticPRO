import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://climaticpro.ro';

    if (error) {
        return NextResponse.redirect(`${baseUrl}/admin/marketing/setup?error=tiktok_denied`);
    }

    if (!code) {
        return NextResponse.json({ error: 'No authorization code provided by TikTok' }, { status: 400 });
    }

    try {
        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;

        // Exchange code for access token
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache'
            },
            body: new URLSearchParams({
                client_key: clientKey!,
                client_secret: clientSecret!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || tokenData.error) {
            console.error('TikTok Token Error:', tokenData);
            return NextResponse.redirect(`${baseUrl}/admin/marketing/setup?error=tiktok_token_failed`);
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const openId = tokenData.open_id;

        let accountName = 'TikTok Account';

        // TikTok User Info endpoint
        try {
            const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const userData = await userRes.json();
            if (userData?.data?.user?.display_name) {
                accountName = userData.data.user.display_name;
            }
        } catch (e) {
            console.error('Could not fetch TikTok user details', e);
        }

        // Upsert Account
        await prisma.socialAccount.upsert({
            where: {
                platform_accountId: {
                    platform: 'tiktok',
                    accountId: openId
                }
            },
            update: {
                accessToken,
                refreshToken,
                accountName,
            },
            create: {
                platform: 'tiktok',
                accountId: openId,
                accessToken,
                refreshToken,
                accountName,
            }
        });

        return NextResponse.redirect(`${baseUrl}/admin/marketing/setup?success=tiktok_connected`);

    } catch (err) {
        console.error('TikTok Auth Callback Error:', err);
        return NextResponse.redirect(`${baseUrl}/admin/marketing/setup?error=tiktok_internal_error`);
    }
}
