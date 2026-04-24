import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getPrisma } from './prisma';

// This system prompt teaches the AI how to think like an HVAC Engineer
const SUPPLY_CHAIN_PROMPT = `
Ești un manager de achiziții expert în industria HVAC din România, lucrând la platforma ClimaticPRO.
Rolul tău este să analizezi denumiri și descrieri "murdare" și incorect formatate ale produselor preluate automat de pe site-urile furnizorilor străini/parteneri și să le trivializezi într-un format curat și comercial pentru a fi vândute direct instalatorilor.

Instrucțiuni de normalizare NLP:
1. Denumirea recomandată ("normalizedName"): Formatează denumirea comercial. Tipar recomandat: [Tip Echipament] [Brand] [Model/Seria], [BTU/Capacitate], [Functii cheie ex: Wi-Fi].
   Exemplu input: "A C GREE BORA WFI 12K"
   Output ideal: "Aparat de aer condiționat Gree Bora, 12000 BTU, Wi-Fi"

2. Găsește categoria potrivită raportat strict la următoarele Categorii Interne disponibile în sistemul nostru. Tu vei întoarce slug-ul cel mai potrivit sau 'diverse'.

3. Prețul și Brand-ul trebuie evaluate logic din context. Dacă denumirea include un brand (Gree, Daikin, Midea, Bosch etc), extrage-l.

4. MUST DO: Extracția exactă a codului de produs. Majoritatea produselor B2B au ascuns în titlu codul de fabrică (ex: MSAGBU-12HRFNX, GWH12ACC-K6DNA1F, PACW29COL). Trebuie să extragi cu maximum de precizie acest alfanumeric, el fiind critic pentru corelarea de preț.
`;

export async function normalizeQuarantineProduct(inputData: { 
    extractedName: string; 
    descriptionHtml?: string; 
    extractedPrice: number;
    supplierName: string;
}) {
    const prisma = getPrisma();
    
    // Extragem din baza de date categoriile disponibile pentru a ghida prompt-ul
    const categories = await (prisma as any).b2BCategory.findMany({ select: { id: true, slug: true, name: true } });
    const categoryInstructions = categories.map((c: any) => `- Categoria "${c.name}" (SLUG: ${c.slug}, ID: ${c.id})`).join('\n');

    try {
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            system: `${SUPPLY_CHAIN_PROMPT}\n\nIată categoriile noastre interne în care poți încadra produsul:\n${categoryInstructions}`,
            schema: z.object({
                normalizedName: z.string().describe('Denumirea curată, comercială și completă în limba română (ex: Aparat de aer condiționat Daikin Sensira 12000 BTU, Wi-Fi)'),
                brand: z.string().nullable().describe('Brandul echipamentului extras corect (ex: Daikin) sau null dacă nu este detectabil'),
                modelCode: z.string().nullable().describe('Codul exact de fabrică/model alfanumeric extras din titlu (ex: MSAGBU-12HRFNX, GWH12ACC). Foarte important!'),
                capacity: z.string().nullable().describe('Capacitatea echipamentului extrasă curat (ex: "12000 BTU", "9000 BTU", "1/4") sau null'),
                recommendedCategorySlug: z.string().describe('Exact slug-ul uneia dintre categoriile interne furnizate, sau "diverse" dacă lipsesc detaliile'),
                recommendedCategoryId: z.number().nullable().describe('ID-ul corespunzător categoriei alese de tine, sau null dacă e în diverse'),
                confidenceScore: z.number().min(10).max(100).describe('Un scor de performanță (0-100) pe care tu ți-l dai asupra corectitudinii asocierilor de mai sus'),
                reasoning: z.string().describe('Scrie o scurtă propoziție în limba română cu motivul normalizării sau problemele detectate în numele original.')
            }),
            prompt: `Te rog standardizează următorul produs provenit de la furnizorul "${inputData.supplierName}":
            Nume original extras: ${inputData.extractedName}
            Preț extras: ${inputData.extractedPrice} RON
            Descriere sursă / context: ${inputData.descriptionHtml ? inputData.descriptionHtml.substring(0, 500) + '...' : '(Lipsă)'}`
        });

        return { success: true, data: object };
    } catch (error: any) {
        console.error('AI Normalization Error:', error);
        return { success: false, message: error.message };
    }
}
