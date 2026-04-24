import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Retrieve all stock items across all installers for the Admin Dispatcher
export async function GET(request: Request) {
    try {
        // Here we'd typically verify the admin token via middleware or `getServerSession`
        // For now, we proceed to fetch

        const allStocks = await prisma.stockItem.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        // We also need the installer names/companies to display who owns what stock
        const installerProfiles = await prisma.installerProfile.findMany({
            select: {
                userId: true,
                companyName: true,
                email: true
            }
        });

        // Convert profiles to a map for fast lookup: { "userId": "Company Name (Email)" }
        const profileMap: Record<string, string> = {};
        for (const p of installerProfiles) {
            profileMap[p.userId] = p.companyName || p.email || `Installer ${p.userId}`;
        }

        // Attach installerName to each stock item
        const enrichedStocks = allStocks.map(stock => ({
            ...stock,
            installerName: profileMap[stock.installerId] || `Instalator #${stock.installerId}`
        }));

        return NextResponse.json({ success: true, stocks: enrichedStocks });

    } catch (error) {
        console.error('Fetch Admin Stocks Error:', error);
        return NextResponse.json({ success: false, message: 'Eroare la preluarea stocurilor globale.' }, { status: 500 });
    }
}
