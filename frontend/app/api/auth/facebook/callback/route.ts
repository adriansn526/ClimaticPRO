import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Helper to return a self-closing HTML script that talks to the opener window
    const closePopup = (status: string) => {
        return new NextResponse(`
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'FB_OAUTH', status: '${status}' }, '*');
                        }
                        window.close();
                    </script>
                    <p>Autentificare completă. Poți închide această fereastră.</p>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    };

    if (error) {
        return closePopup('facebook_auth_declined');
    }

    if (!code) {
        return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
        return NextResponse.json({ error: 'Facebook App Credentials not configured' }, { status: 500 });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://climaticpro.ro').replace(/\/$/, '');
    const redirectUri = `${siteUrl}/api/auth/facebook/callback`;

    try {
        // Step 1: Exchange code for short-lived User Access Token
        const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('FB Token Error:', tokenData.error);
            return closePopup('facebook_token_exchange');
        }

        const shortLivedToken = tokenData.access_token;

        // Step 2: Exchange short-lived token for long-lived User Access Token (~60 days)
        const longLivedResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
        const longLivedData = await longLivedResponse.json();

        const longLivedToken = longLivedData.access_token || shortLivedToken;

        // Add Telemetry for Permissions
        const permResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${longLivedToken}`);
        const permData = await permResponse.json();
        console.log('--- FB PERMISSIONS ---', JSON.stringify(permData));

        const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`);
        const pagesData = await pagesResponse.json();

        console.log('--- FB PAGES ENDPOINT RESPONSE ---', JSON.stringify(pagesData));

        if (pagesData.error || !pagesData.data || pagesData.data.length === 0) {
            console.error('FB Pages Error:', pagesData);
            return closePopup('no_facebook_pages_found');
        }

        // For simplicity, we grab the first page the user manages. 
        // In a complex setup, we'd show a UI step to let them choose the page.
        const page = pagesData.data[0];
        const pageAccessToken = page.access_token;
        const pageId = page.id;
        const pageName = page.name;

        // Step 4: Persist the Page Access Token to our Database
        await prisma.socialAccount.upsert({
            where: {
                platform_accountId: {
                    platform: 'facebook',
                    accountId: pageId
                }
            },
            update: {
                accessToken: pageAccessToken,
                accountName: pageName,
                // Page tokens normally don't expire, but we might store related metadata here
            },
            create: {
                platform: 'facebook',
                accountId: pageId,
                accessToken: pageAccessToken,
                accountName: pageName
            }
        });

        // Redirect back to the Social Planner UI with success param
        return closePopup('facebook_connected');

    } catch (err) {
        console.error('Facebook Auth Flow Exception:', err);
        return closePopup('facebook_internal_error');
    }
}
