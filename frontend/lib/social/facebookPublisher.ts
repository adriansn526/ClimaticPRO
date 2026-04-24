import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function publishToFacebook(postId: number) {
    try {
        // 1. Fetch the post details from DB
        const post = await prisma.socialPost.findUnique({
            where: { id: postId }
        });

        if (!post) {
            throw new Error(`Post with ID ${postId} not found.`);
        }

        const platforms = (post.platforms as string[]) || [];
        if (!platforms.includes('facebook')) {
            return { success: true, message: 'Platform ignores Facebook' };
        }

        // 2. Fetch the active Facebook Page Access Token
        const fbAccount = await prisma.socialAccount.findFirst({
            where: { platform: 'facebook' }
        });

        if (!fbAccount || !fbAccount.accessToken || !fbAccount.accountId) {
            throw new Error(`No connected Facebook Page found or token is missing.`);
        }

        const { accessToken, accountId } = fbAccount;
        const textContent = post.text || '';

        // 3. Determine endpoint API based on Media Type
        // For Phase 1 (Text only), we hit the /feed endpoint.
        // For Phase 2 (Images), we hit /photos endpoint.

        // TODO: Full media URL support. Assuming text-only for immediate MVP functionality
        const graphUrl = `https://graph.facebook.com/v19.0/${accountId}/feed`;

        const requestBody = new URLSearchParams({
            message: textContent,
            access_token: accessToken,
        });

        console.log(`Sending API request to Meta Graph for Post ID: ${postId}`);

        // 4. Fire the Request to Meta
        const response = await fetch(graphUrl, {
            method: 'POST',
            body: requestBody,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Facebook Graph Error Response:', data);
            throw new Error(data.error?.message || 'Unknown Facebook API error');
        }

        // 5. Success! Mark post as published in DB
        await prisma.socialPost.update({
            where: { id: postId },
            data: {
                status: 'published',
                facebookPostId: data.id
            }
        });

        console.log(`Successfully published to Facebook. FB Post ID: ${data.id}`);
        return { success: true, facebookPostId: data.id };

    } catch (error) {
        console.error(`Failed to publish post ${postId} to Facebook:`, error);

        // Mark as failed so we don't infinitely retry it later
        await prisma.socialPost.update({
            where: { id: postId },
            data: { status: 'failed' }
        });

        throw error;
    }
}
