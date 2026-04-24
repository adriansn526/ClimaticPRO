import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all connected social accounts
export async function GET(request: Request) {
    try {
        // We only return safe metadata, never the secrets/tokens
        const accounts = await prisma.socialAccount.findMany({
            select: {
                id: true,
                platform: true,
                accountId: true,
                accountName: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json(accounts);
    } catch (error) {
        console.error('Error fetching social accounts:', error);
        return NextResponse.json({ error: 'Failed to fetch social accounts' }, { status: 500 });
    }
}
