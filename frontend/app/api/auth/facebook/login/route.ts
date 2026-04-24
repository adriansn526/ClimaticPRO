import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const appId = process.env.FACEBOOK_APP_ID;

    if (!appId) {
        return NextResponse.json({ error: 'Facebook App ID not configured' }, { status: 500 });
    }

    // Use the explicitly defined site URL to avoid proxy protocol stripping (http vs https mismatch)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://climaticpro.ro';
    const redirectUri = `${siteUrl}/api/auth/facebook/callback`;

    // Construct the Facebook OAuth Dialog URL
    // We request 'pages_show_list', 'pages_manage_posts' and 'pages_read_engagement' to be able to list and publish on behalf of a page
    const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,public_profile,business_management,instagram_basic,instagram_content_publish',
        response_type: 'code',
        auth_type: 'rerequest',
    });

    const facebookLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

    // Redirect the user to Facebook's consent screen
    return NextResponse.redirect(facebookLoginUrl);
}
