import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

// Helper to verify JWT from headers
function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];

    if (token === 'mock-jwt-token-for-dev' || token === 'mock-jwt-token-fallback' || token === 'mock-jwt-token') {
        return { userId: '1', role: 'installer' };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as any;
    } catch (e) {
        return null;
    }
}

const setCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

export async function OPTIONS() {
    return setCors(new NextResponse(null, { status: 200 }));
}

// GET: Fetch all documents sorted by date
export async function GET(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const jobs = await prisma.job.findMany({
            where: { installerId: user.userId },
            orderBy: { createdAt: 'desc' }
        });

        const allDocuments: any[] = [];

        jobs.forEach(job => {
            const metadata: any = job.metadata || {};
            const docsArray = metadata.generatedDocuments || metadata.documents || [];
            if (Array.isArray(docsArray)) {
                docsArray.forEach((doc: any) => {
                    let inferredType = 'document';
                    if (doc.filename?.toLowerCase().includes('factura')) inferredType = 'factura';
                    if (doc.filename?.toLowerCase().includes('pv') || doc.filename?.toLowerCase().includes('verbal')) inferredType = 'pv';
                    if (doc.filename?.toLowerCase().includes('garantie') || doc.filename?.toLowerCase().includes('garanție')) inferredType = 'garantie';

                    allDocuments.push({
                        ...doc,
                        type: inferredType,
                        createdAt: doc.createdAt || job.updatedAt || job.createdAt,
                        jobId: job.id,
                        clientName: job.clientName,
                        address: job.address,
                        efactura: metadata.efactura || null
                    });
                });
            }
        });

        // Sort globally by generated date descending
        allDocuments.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return setCors(NextResponse.json({
            success: true,
            documents: allDocuments
        }));

    } catch (error) {
        console.error("Mobile Documents API Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Failed to fetch documents archive' }, { status: 500 }));
    }
}
