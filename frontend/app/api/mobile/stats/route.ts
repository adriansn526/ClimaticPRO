import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Authorization header missing' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
        }
        const userId = decoded.userId || decoded.id;
        
        const prisma = getPrisma();
        
        // Parse dates from url
        const url = new URL(request.url);
        const startParam = url.searchParams.get('startDate');
        const endParam = url.searchParams.get('endDate');

        // Allow fallback to generic query if no range provided
        let dateQuery = {};
        if (startParam && endParam) {
            dateQuery = {
                createdAt: {
                    gte: new Date(startParam),
                    lte: new Date(endParam)
                }
            };
        }

        // Find jobs for this installer mathematically inside the date query boundaries
        const jobs = await prisma.job.findMany({
            where: {
                installerId: userId,
                ...dateQuery
            }
        });

        const rawStats = { completate: 0, anulate: 0, total_incasat: 0, estimat: 10000 };

        jobs.forEach((job) => {
            // Compute job revenue (Fallback to 450 per installation if no strict metadata array found)
            let jobRevenue = 450; 
            const metadata: any = job.metadata || {};
            
            // Check manual priceLabor if manually created
            if (job.isManual && metadata.priceLabor) {
                jobRevenue = parseFloat(metadata.priceLabor);
            } else if (metadata.generatedDocuments && metadata.generatedDocuments.length > 0) {
                if (metadata.customPrice) {
                    jobRevenue = parseFloat(metadata.customPrice);
                }
            }

            const isCompleted = job.status === 'completed' || job.status === 'invoiced' || job.status === 'pending_payment';
            const isCancelled = job.status === 'cancelled';

            if (isCompleted) { 
                rawStats.completate++; 
                rawStats.total_incasat += jobRevenue; 
            }
            if (isCancelled) { 
                rawStats.anulate++; 
            }
        });

        // Set dynamic estimation goal based on length of period
        if (startParam && endParam) {
            const days = (new Date(endParam).getTime() - new Date(startParam).getTime()) / (1000 * 3600 * 24);
            rawStats.estimat = Math.max(1000, Math.floor(days * 333)); // Rough estimate goal scaling
        }

        return NextResponse.json({ success: true, stats: rawStats });
    } catch (error) {
        console.error('Failed fetching installer stats:', error);
        return NextResponse.json({ success: false, error: 'Eroare internă server' }, { status: 500 });
    }
}
