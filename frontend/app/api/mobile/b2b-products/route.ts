import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// Helper to set CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
    const prisma = getPrisma();
    try {
        // Fetch all active B2B products from the database
        const b2bProducts = await prisma.b2BProduct.findMany({
            where: {
                active: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Map them to the format expected by the mobile app context
        const formattedProducts = b2bProducts.map((product: any) => ({
            id: product.id.toString(),
            name: product.name,
            capacity: product.capacity || '',
            priceB2B: product.priceB2B,
            priceRetail: product.priceRetail || 0,
            stock: product.stock,
            unit: product.unit || 'buc',
            manageStock: product.manageStock !== undefined ? product.manageStock : true,
            image: product.image || 'https://via.placeholder.com/150/E5E7EB/4B5563?text=Produs',
            description: product.description || '',
            attributes: product.attributes || [],
            category: product.category?.name || (
                // Temporary inference for mock data clustering
                product.name.toLowerCase().includes('aer') || product.name.toLowerCase().includes('pompă') ? 'Sisteme Climatizare' :
                product.name.toLowerCase().includes('țeavă') || product.name.toLowerCase().includes('suport') ? 'Materiale Instalare' :
                product.name.toLowerCase().includes('pompă de condens') || product.name.toLowerCase().includes('vid') ? 'Scule' : 'Diverse'
            )
        }));

        const response = NextResponse.json({ success: true, products: formattedProducts }, { status: 200 });

        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;
    } catch (error) {
        console.error('Error fetching B2B products:', error);
        const errorResponse = NextResponse.json({ error: 'Failed to fetch B2B products' }, { status: 500 });
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
    }
}
