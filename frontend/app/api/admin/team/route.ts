import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const prisma = getPrisma();
export const dynamic = 'force-dynamic';

// GET all admin users
export async function GET() {
    try {
        const users = await prisma.adminUser.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
            }
        });
        return NextResponse.json({ success: true, users });
    } catch (error) {
        console.error("Failed to fetch admin users:", error);
        return NextResponse.json({ success: false, error: 'Eroare la obținerea membrilor.' }, { status: 500 });
    }
}

// POST create an admin user
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, role, password } = body;

        if (!name || !email || !role || !password) {
            return NextResponse.json({ success: false, message: 'Toate câmpurile sunt obligatorii.' }, { status: 400 });
        }

        // Check unique
        const existing = await prisma.adminUser.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Există deja un cont cu acest email.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.adminUser.create({
            data: {
                name,
                email,
                role,
                password: hashedPassword,
                active: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ success: true, user: newUser });
    } catch (error) {
        console.error("Failed to create admin user:", error);
        return NextResponse.json({ success: false, error: 'Eroare la crearea contului.' }, { status: 500 });
    }
}
