import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function publishToTikTok(postId: number) {
    try {
        // 1. Fetch the post details
        const post = await prisma.socialPost.findUnique({
            where: { id: postId }
        });

        if (!post) {
            throw new Error(`Post with ID ${postId} not found.`);
        }

        const platforms = (post.platforms as string[]) || [];
        if (!platforms.includes('tiktok')) {
            return { success: true, message: 'Platform ignores TikTok' };
        }

        // TikTok strictly requires video media
        if (post.mediaType !== 'video' || !post.mediaUrl) {
            throw new Error(`TikTok API strictly requires a video attachment.`);
        }

        // 2. Fetch the active TikTok Account Token
        const tiktokAccount = await prisma.socialAccount.findFirst({
            where: { platform: 'tiktok' }
        });

        if (!tiktokAccount || !tiktokAccount.accessToken || !tiktokAccount.accountId) {
            throw new Error(`No connected TikTok Account found.`);
        }

        const { accessToken, accountId } = tiktokAccount;
        const textContent = post.text || '';

        // 3. Step 1: Initialize Video Upload (Direct Post)
        console.log(`[TikTok] Step 1: Initialize Video Upload for Post ID: ${postId}`);

        // Since we have a URL, we need to fetch the file to know its size
        const mediaRes = await fetch(post.mediaUrl);
        if (!mediaRes.ok) {
            throw new Error(`Could not fetch media file from URL: ${post.mediaUrl}`);
        }

        // TikTok requires the video size in bytes for the init step
        const videoSize = mediaRes.headers.get('content-length');
        if (!videoSize) {
            throw new Error(`Could not determine video file size.`);
        }

        // Prepare Init Request body
        // https://developers.tiktok.com/doc/content-posting-api-reference-direct-post/
        const initPayload = {
            post_info: {
                title: textContent,
                privacy_level: "PUBLIC_TO_EVERYONE",
                disable_comment: false,
                disable_duet: false,
                disable_stitch: false
            },
            source_info: {
                source: "FILE_UPLOAD",
                video_size: parseInt(videoSize, 10),
                chunk_size: parseInt(videoSize, 10), // For simplicity, we try a single chunk if it's small enough. Max is usually 50MB per chunk.
                total_chunk_count: 1
            }
        };

        const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(initPayload)
        });

        const initData = await initRes.json();

        if (!initRes.ok || initData.error?.code !== 'ok') {
            console.error('TikTok Init Error:', initData);
            throw new Error(initData.error?.message || 'Failed to initialize TikTok video upload');
        }

        const publishId = initData.data.publish_id;
        const uploadUrl = initData.data.upload_url;

        console.log(`[TikTok] Init Successful. Publish ID: ${publishId}. Uploading bytes to ${uploadUrl}...`);

        // 4. Step 2: Upload Video Bytes
        // We read the fetched media into a buffer and PUT it to the provided upload URL
        const videoBuffer = await mediaRes.arrayBuffer();

        const uploadChunkRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'video/mp4', // Adjust if we support other formats natively
                'Content-Range': `bytes 0-${parseInt(videoSize, 10) - 1}/${parseInt(videoSize, 10)}`
            },
            body: videoBuffer
        });

        if (!uploadChunkRes.ok) {
            console.error('TikTok Upload Error Status:', uploadChunkRes.status, await uploadChunkRes.text());
            throw new Error('Failed to upload video bytes to TikTok');
        }

        console.log(`[TikTok] Bytes uploaded successfully. Video is processing.`);

        // 5. Success! Mark post as published and store the tracking ID
        // Note: The publish_id is NOT the public video ID, it's the internal job ID.
        // We use webhooks to get the final public ID. For now, we store the tracking ID.
        await prisma.socialPost.update({
            where: { id: postId },
            data: {
                status: 'published',
                tiktokPostId: publishId // Storing the job tracker
            }
        });

        return { success: true, tiktokPostId: publishId };

    } catch (error) {
        console.error(`Failed to publish post ${postId} to TikTok:`, error);

        await prisma.socialPost.update({
            where: { id: postId },
            data: { status: 'failed' }
        });

        throw error;
    }
}
