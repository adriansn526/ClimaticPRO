import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json({ error: 'Token-ul Replicate nu este configurat' }, { status: 500 });
        }

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const prediction = await replicate.predictions.get(id);

        if (prediction?.error) {
            return NextResponse.json({ error: prediction.error }, { status: 500 });
        }

        return NextResponse.json({
            status: prediction.status,
            output: prediction.output, // Arrays of Image URls when succeeded
            logs: prediction.logs
        });

    } catch (error: any) {
        console.error('Replicate Polling Error:', error);
        return NextResponse.json({ error: error.message || 'Eroare la obținerea statusului' }, { status: 500 });
    }
}
