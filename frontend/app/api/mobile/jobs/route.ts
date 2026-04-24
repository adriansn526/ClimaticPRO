import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const prisma = getPrisma();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
export const dynamic = 'force-dynamic';

// Helper to verify JWT from headers
function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];

    // Support Dev Mock Tokens
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

// Helper to add CORS to responses
const setCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
};

// GET: Fetch Active Jobs for the logged-in Installer
export async function GET(request: Request) {
    try {
        const user = verifyToken(request);
        if (!user) {
            return setCors(NextResponse.json({ success: false, message: 'Neautorizat' }, { status: 401 }));
        }

        const installerId = user.userId;

        const jobs = await prisma.job.findMany({
            where: {
                installerId: installerId,
                status: {
                    in: ['pending', 'in_progress', 'scheduled']
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform for Mobile UI
        const mappedJobs = jobs.map((job) => {
            const meta = job.metadata as any || {};

            let formattedDate = meta.appointmentDate;
            if (!formattedDate && meta.rawAppointmentDate) {
                try {
                    const d = new Date(meta.rawAppointmentDate);
                    if (!isNaN(d.getTime())) {
                        formattedDate = d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Bucharest' });
                    } else {
                        formattedDate = meta.rawAppointmentDate;
                    }
                } catch(e) {
                    formattedDate = meta.rawAppointmentDate;
                }
            }

            return {
                id: job.id.toString(),
                client: job.clientName,
                address: job.address,
                phone: job.clientPhone,
                date: new Date(job.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' }),
                status: job.status,
                products: meta.products ? meta.products.map((p: any) => p.name) : [],
                productsDetailed: meta.products || [],
                metadata: meta,
                appointmentDate: formattedDate || 'Neprogramat',
                rawAppointmentDate: meta.rawAppointmentDate,
                customerNote: meta.customerNote || null,
                isManual: job.isManual
            };
        });

        return setCors(NextResponse.json({ success: true, jobs: mappedJobs }));

    } catch (error) {
        console.error("Mobile Jobs API Error:", error);
        return setCors(NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 }));
    }
}

// Handle CORS Preflight requests
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
