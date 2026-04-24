import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const maxDuration = 60; // Allow 60s max execution time for safety

export async function POST(req: Request) {
    try {
        const { prompt, productImageUrl } = await req.json();

        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json({ error: 'Token-ul Replicate nu este configurat în .env' }, { status: 500 });
        }

        // Initialize Replicate
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const fullPrompt = `A high quality, cinematic advertising banner. The main subject is an air conditioning or HVAC product shown exactly as the input image. ${prompt}. Professional studio lighting, 4k, hyperrealistic.`;

        console.log("Generare Banner AI cu prompt:", fullPrompt, "Produs URL:", productImageUrl);

        // Run prediction against an SDXL Image-to-Image / Inpainting model natively
        // In this architecture we use a fast and reliable SDXL model from Replicate
        const prediction = await replicate.predictions.create({
            model: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL 1.0
            input: {
                prompt: fullPrompt,
                image: productImageUrl || undefined,
                prompt_strength: 0.8, // Allow AI to generate beautiful background while keeping shape
                num_inference_steps: 30,
                guidance_scale: 7.5,
                refine: "expert_ensemble_refiner",
                apply_watermark: false
            }
        });

        // Return the prediction ID so the frontend can poll its status
        return NextResponse.json({
            success: true,
            predictionId: prediction.id,
            status: prediction.status,
            message: "Generarea banner-ului a început dinamic!"
        });

    } catch (error: any) {
        console.error('Replicate Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Eroare internă la AI Generator' }, { status: 500 });
    }
}
