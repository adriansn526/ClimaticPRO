import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { publishToFacebook } from '@/lib/social/facebookPublisher';
import { publishToInstagram } from '@/lib/social/instagramPublisher';

const prisma = new PrismaClient();

// This endpoint should ideally be protected by a Secret Header
// so it cannot be triggered externally by malicious actors
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-123';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[CRON] Starting social media publish cycle...');

        // 1. Get current date & time
        const now = new Date();
        // Since scheduledDate is saved as a Date at midnight UTC via new Date('yyyy-mm-dd')
        const todayStr = now.toISOString().split('T')[0];

        // Romanian Timezone approximation for MVP (or simply use local server time if matched)
        // Format to HH:mm string (e.g. "14:30")
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMins = String(now.getMinutes()).padStart(2, '0');
        const currentTimeString = `${currentHours}:${currentMins}`;

        // Fetch all "scheduled" posts that are from today OR the past,
        // and whose time has arrived
        const pendingPosts = await prisma.socialPost.findMany({
            where: {
                status: 'scheduled',
                // Look for posts scheduled for today or earlier
                scheduledDate: {
                    lte: new Date(todayStr)
                }
            }
        });

        const postsToPublish = pendingPosts.filter(post => {
            // If it's a date strictly in the past, publish it immediately
            if (post.scheduledDate < new Date(todayStr)) return true;

            // If it's today, check if the hour has passed
            return post.scheduledTime <= currentTimeString;
        });

        console.log(`[CRON] Found ${postsToPublish.length} posts ready to publish.`);

        const results = [];

        const { publishToFacebook } = require('@/lib/social/facebookPublisher');
        const { publishToInstagram } = require('@/lib/social/instagramPublisher');
        const { publishToTikTok } = require('@/lib/social/tiktokPublisher');

        // 3. Loop through and publish
        for (const post of postsToPublish) {
            try {
                // Update status to 'publishing' to prevent double-sends if cron overlaps
                await prisma.socialPost.update({
                    where: { id: post.id },
                    data: { status: 'publishing' }
                });

                const platforms = (post.platforms as string[]) || [];
                const postResults: any = {};

                if (platforms.includes('facebook')) {
                    try {
                        postResults.facebook = await publishToFacebook(post.id);
                    } catch (fbErr: any) {
                        postResults.facebook = { error: fbErr.message };
                    }
                }

                if (platforms.includes('instagram')) {
                    try {
                        postResults.instagram = await publishToInstagram(post.id);
                    } catch (igErr: any) {
                        postResults.instagram = { error: igErr.message };
                    }
                }

                if (platforms.includes('tiktok')) {
                    try {
                        postResults.tiktok = await publishToTikTok(post.id);
                    } catch (tkErr: any) {
                        postResults.tiktok = { error: tkErr.message };
                    }
                }

                // Consider it failed if ALL requested platforms threw an error
                const requestedPlatformCount = platforms.length;
                let errorCount = 0;
                if (platforms.includes('facebook') && postResults.facebook?.error) errorCount++;
                if (platforms.includes('instagram') && postResults.instagram?.error) errorCount++;
                if (platforms.includes('tiktok') && postResults.tiktok?.error) errorCount++;

                const completelyFailed = requestedPlatformCount > 0 && errorCount === requestedPlatformCount;

                if (completelyFailed) {
                    await prisma.socialPost.update({
                        where: { id: post.id },
                        data: { status: 'failed', errorLogs: JSON.stringify(postResults) }
                    });
                    results.push({ id: post.id, status: 'failed', details: postResults });
                } else {
                    results.push({ id: post.id, status: 'success', details: postResults });
                }

            } catch (err: any) {
                console.error(`[CRON] Error publishing post ${post.id}:`, err);
                results.push({ id: post.id, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            processedCount: postsToPublish.length,
            results
        });

    } catch (error) {
        console.error('[CRON] Critical failure:', error);
        return NextResponse.json({ error: 'Cron interval failed' }, { status: 500 });
    }
}
