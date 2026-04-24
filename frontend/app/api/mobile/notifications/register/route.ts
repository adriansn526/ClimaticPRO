import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123';

export async function POST(request: Request) {
    try {
        // PERMIT UNSECURE ERROR LOGGING TEMPORARILY FOR DEBUGGING
        const bodyContent = await request.clone().text();
        const isErrorLog = bodyContent.includes('ERROR_LOG');

        const authHeader = request.headers.get('authorization');
        console.log(`[PUSH REGISTER] Request received! Auth header length: ${authHeader?.length}, isErrorLog: ${isErrorLog}`);
        if(isErrorLog) {
            console.log(`[PUSH REGISTER ERROR BODY]: ${bodyContent}`);
        }
        
        if (!isErrorLog && (!authHeader || !authHeader.startsWith('Bearer '))) {
            console.log('[PUSH REGISTER] No valid auth header. Returning 401.');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader?.split(' ')[1];
        let decoded: any;
        
        if (!isErrorLog && token) {
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (e) {
                console.log('[PUSH REGISTER] JWT Verify failed. Returning 401.');
                return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
            }
        }

        if (!isErrorLog) {
            const userId = decoded?.userId || decoded?.id;
            if (!userId) {
                console.log('[PUSH REGISTER] No userId in token. Returning 400.');
                return NextResponse.json({ success: false, error: 'Malformed token payload' }, { status: 400 });
            }

            const bodyContentJson = JSON.parse(bodyContent);
            const expoPushToken = bodyContentJson.expoPushToken;
            console.log(`[PUSH REGISTER] Found userId: ${userId}, expoPushToken: ${expoPushToken}`);
            
            if (!expoPushToken) {
                return NextResponse.json({ success: false, error: 'Lipseste expoPushToken' }, { status: 400 });
            }

            const prisma = getPrisma();
            
            // Update the user's installer profile with the new token
            await prisma.installerProfile.upsert({
                where: { userId },
                update: { expoPushToken },
                create: {
                    userId,
                    expoPushToken,
                    status: 'pending'
                }
            });
        }
        return NextResponse.json({ success: true, message: 'Push token saved successfully' });
    } catch (error) {
        console.error('Failed registering push token:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
