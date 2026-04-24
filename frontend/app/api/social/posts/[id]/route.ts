import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { publishToFacebook } from '@/lib/social/facebookPublisher';

const prisma = new PrismaClient();

// PUT update an existing social post
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { text, mediaUrl, mediaType, scheduledDate, scheduledTime, platforms, publishNow } = body;

        // Validation
        if (!platforms || platforms.length === 0 || (!publishNow && (!scheduledDate || !scheduledTime))) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedPost = await prisma.socialPost.update({
            where: { id },
            data: {
                text,
                mediaUrl,
                mediaType: mediaType || 'none',
                scheduledDate: publishNow ? new Date() : new Date(scheduledDate),
                scheduledTime: publishNow ? new Date().toTimeString().substring(0, 5) : scheduledTime,
                platforms,
                ...(publishNow && { status: 'publishing' })
            }
        });

        if (publishNow) {
            try {
                await publishToFacebook(updatedPost.id);
            } catch (err) {
                return NextResponse.json({ error: 'Post updated, but failed to publish instantly to Facebook.' }, { status: 500 });
            }
        }

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error('Error updating social post:', error);
        return NextResponse.json({ error: 'Failed to update social post' }, { status: 500 });
    }
}

// DELETE a social post
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const postToDelete = await prisma.socialPost.findUnique({
            where: { id }
        });

        if (!postToDelete) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // If the post is published to Facebook, attempt a remote delete
        if (postToDelete.facebookPostId) {
            const fbAccount = await prisma.socialAccount.findFirst({
                where: { platform: 'facebook' }
            });

            if (fbAccount && fbAccount.accessToken) {
                try {
                    console.log(`[DELETE] Attempting to remove post from Facebook: ${postToDelete.facebookPostId}`);
                    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${postToDelete.facebookPostId}?access_token=${fbAccount.accessToken}`, {
                        method: 'DELETE'
                    });

                    if (!fbRes.ok) {
                        const errorData = await fbRes.json();
                        console.error('Facebook Graph Remote Delete Error:', errorData);
                        // We continue with local deletion even if remote fails
                    }
                } catch (err) {
                    console.error('Network Error during Facebook Remote Delete:', err);
                }
            }
        }

        // If the post is published to Instagram, attempt a remote delete
        if (postToDelete.instagramPostId) {
            const igAccount = await prisma.socialAccount.findFirst({
                where: { platform: 'instagram' }
            });

            if (igAccount && igAccount.accessToken) {
                try {
                    console.log(`[DELETE] Attempting to remove post from Instagram: ${postToDelete.instagramPostId}`);
                    // Note: Deleting a media object on IG uses the same Graph API endpoint pattern
                    const igRes = await fetch(`https://graph.facebook.com/v19.0/${postToDelete.instagramPostId}?access_token=${igAccount.accessToken}`, {
                        method: 'DELETE'
                    });

                    if (!igRes.ok) {
                        const errorData = await igRes.json();
                        console.error('Instagram Graph Remote Delete Error:', errorData);
                    }
                } catch (err) {
                    console.error('Network Error during Instagram Remote Delete:', err);
                }
            }
        }

        await prisma.socialPost.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting social post:', error);
        return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 });
    }
}
