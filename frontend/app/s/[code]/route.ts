import { NextResponse, NextRequest } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = getPrisma();

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
    try {
        const { code } = params;
        
        if (!code) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Find the shortlink
        const urlObj = await prisma.shortLink.findUnique({
            where: { shortCode: code }
        });

        if (!urlObj) {
            // Not found, redirect home
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Increment click counter async without awaiting it (fire and forget)
        prisma.shortLink.update({
            where: { id: urlObj.id },
            data: { clicks: { increment: 1 } }
        }).catch(err => console.error("Could not increment click count:", err));

        // Redirect explicitly via 308 Perm Redirect or 302 Temporary
        return NextResponse.redirect(urlObj.targetUrl, 302);
        
    } catch (e) {
        console.error("Shortlink error:", e);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
