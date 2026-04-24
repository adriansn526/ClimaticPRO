import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const prisma = getPrisma();

// PUT update admin user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const { name, email, role, active, password } = body;

        const updateData: any = {
            name,
            email,
            role,
            active
        };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.adminUser.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Failed to update admin user:", error);
        return NextResponse.json({ success: false, error: 'Eroare la actualizarea membrului.' }, { status: 500 });
    }
}

// DELETE delete admin user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        await prisma.adminUser.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Utilizator șters cu succes.' });
    } catch (error) {
        console.error("Failed to delete admin user:", error);
        return NextResponse.json({ success: false, error: 'Eroare la ștergerea utilizatorului.' }, { status: 500 });
    }
}
