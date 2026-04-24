import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint receives Webhook events from TikTok
// Required because video processing is asynchronous
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const eventType = body?.type; // e.g., 'direct_post.update'

        console.log(`[TikTok Webhook] Received Event:`, eventType);

        if (eventType === 'direct_post.update') {
            const data = body.data;
            const publishId = data?.publish_id;
            const status = data?.status; // e.g., 'PUBLISH_SUCCESS' or 'PUBLISH_FAILED'

            if (publishId) {
                // Find the post awaiting an update
                const post = await prisma.socialPost.findFirst({
                    where: { tiktokPostId: publishId }
                });

                if (post) {
                    let newStatus = post.status;
                    let errorLogs = post.errorLogs;

                    if (status === 'PUBLISH_SUCCESS') {
                        newStatus = 'published';
                        console.log(`[TikTok Webhook] Post ${post.id} successfully published to TikTok.`);
                    } else if (status === 'PUBLISH_FAILED' || status === 'UPLOAD_FAILED') {
                        newStatus = 'failed';
                        errorLogs = JSON.stringify({
                            tiktok_webhook_error: data?.fail_reason || 'Unknown processing error'
                        });
                        console.error(`[TikTok Webhook] Post ${post.id} failed processing on TikTok:`, errorLogs);
                    }

                    await prisma.socialPost.update({
                        where: { id: post.id },
                        data: {
                            status: newStatus,
                            errorLogs
                        }
                    });
                }
            }
        }

        // TikTok requires a 200 OK fast to acknowledge receipt
        return NextResponse.json({ success: true, message: 'Webhook received' }, { status: 200 });

    } catch (error) {
        console.error('[TikTok Webhook] Processing Error:', error);
        // We still return 200 so TikTok doesn't aggressively retry malformed payloads
        return NextResponse.json({ success: false, message: 'Internal Webhook Error' }, { status: 200 });
    }
}
