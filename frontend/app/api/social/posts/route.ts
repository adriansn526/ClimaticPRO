import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { publishToFacebook } from '@/lib/social/facebookPublisher';
import { publishToInstagram } from '@/lib/social/instagramPublisher';
import { publishToTikTok } from '@/lib/social/tiktokPublisher';

const prisma = new PrismaClient();

// GET all social posts
export async function GET(request: Request) {
    try {
        const posts = await prisma.socialPost.findMany({
            orderBy: [
                { scheduledDate: 'asc' },
                { scheduledTime: 'asc' }
            ]
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error('Error fetching social posts:', error);
        return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 });
    }
}

// POST a new scheduled post
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, mediaUrl, mediaType, scheduledDate, scheduledTime, platforms, publishNow } = body;

        // Validation
        if (!platforms || platforms.length === 0 || (!publishNow && (!scheduledDate || !scheduledTime))) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newPost = await prisma.socialPost.create({
            data: {
                text,
                mediaUrl,
                mediaType: mediaType || 'none',
                scheduledDate: publishNow ? new Date() : new Date(scheduledDate),
                scheduledTime: publishNow ? new Date().toTimeString().substring(0, 5) : scheduledTime,
                platforms,
                status: publishNow ? 'publishing' : 'scheduled'
            }
        });

        if (publishNow) {
            // Await the instant publish before resolving the route
            try {
                const platforms = newPost.platforms as string[];
                if (platforms.includes('facebook')) {
                    await publishToFacebook(newPost.id);
                }
                if (platforms.includes('instagram')) {
                    await publishToInstagram(newPost.id);
                }
                if (platforms.includes('tiktok')) {
                    await publishToTikTok(newPost.id);
                }
                // Status is updated to 'published' inside the helper
            } catch (err) {
                return NextResponse.json({ error: 'Post saved, but failed to publish instantly.' }, { status: 500 });
            }
        }

        return NextResponse.json(newPost);
    } catch (error) {
        console.error('Error creating social post:', error);
        return NextResponse.json({ error: 'Failed to create social post' }, { status: 500 });
    }
}
