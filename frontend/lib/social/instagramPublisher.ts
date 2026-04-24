import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function publishToInstagram(postId: number) {
    try {
        // 1. Fetch the post details from DB
        const post = await prisma.socialPost.findUnique({
            where: { id: postId }
        });

        if (!post) {
            throw new Error(`Post with ID ${postId} not found.`);
        }

        const platforms = (post.platforms as string[]) || [];
        if (!platforms.includes('instagram')) {
            return { success: true, message: 'Platform ignores Instagram' };
        }

        // Instagram strict requirement: Must have media
        if (!post.mediaUrl || post.mediaType === 'none') {
            throw new Error(`Instagram API strictly requires an image or video attachment.`);
        }

        // 2. Fetch the active Instagram Account Token
        const igAccount = await prisma.socialAccount.findFirst({
            where: { platform: 'instagram' }
        });

        if (!igAccount || !igAccount.accessToken || !igAccount.accountId) {
            throw new Error(`No connected Instagram Business Account found. Re-run token injection.`);
        }

        const { accessToken, accountId } = igAccount;
        const textContent = post.text || '';

        // 3. Step One: Create Media Container
        console.log(`[Instagram] Step 1: Creating Media Container for Post ID: ${postId}`);

        const mediaParams = new URLSearchParams({
            caption: textContent,
            access_token: accessToken,
        });

        // Attach appropriate media URL parameters
        if (post.mediaType === 'video') {
            mediaParams.append('media_type', 'VIDEO');
            mediaParams.append('video_url', post.mediaUrl);
        } else {
            mediaParams.append('image_url', post.mediaUrl);
        }

        const createMediaUrl = `https://graph.facebook.com/v19.0/${accountId}/media`;

        const createRes = await fetch(createMediaUrl, {
            method: 'POST',
            body: mediaParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const createData = await createRes.json();

        if (!createRes.ok) {
            console.error('Instagram Container Creation Error:', createData);
            throw new Error(createData.error?.message || 'Failed to create Instagram media container');
        }

        const creationId = createData.id;
        console.log(`[Instagram] Container Created: ${creationId}. Proceeding to Step 2...`);

        // 4. Step Two: Publish the Container
        const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`;
        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: accessToken,
        });

        const publishRes = await fetch(publishUrl, {
            method: 'POST',
            body: publishParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const publishData = await publishRes.json();

        if (!publishRes.ok) {
            console.error('Instagram Publishing Error:', publishData);
            throw new Error(publishData.error?.message || 'Failed to publish Instagram media container');
        }

        // 5. Success! Mark post as published in DB and store IG Post ID
        await prisma.socialPost.update({
            where: { id: postId },
            data: {
                status: 'published',
                instagramPostId: publishData.id
            }
        });

        console.log(`Successfully published to Instagram. IG Post ID: ${publishData.id}`);
        return { success: true, instagramPostId: publishData.id };

    } catch (error) {
        console.error(`Failed to publish post ${postId} to Instagram:`, error);

        await prisma.socialPost.update({
            where: { id: postId },
            data: { status: 'failed' }
        });

        throw error;
    }
}
