import { NextResponse } from 'next/server';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 3) {
            return NextResponse.json({ success: true, results: [] });
        }

        const WooCommerce = new WooCommerceRestApi({
            url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms.climaticpro.ro',
            consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
            consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
            version: 'wc/v3',
        });

        // Căutam strict în comenzile finalizate (acolo există nr. tel. garantat și produsele achiziționate)
        const response = await WooCommerce.get('orders', {
            search: query,
            status: 'completed',
            per_page: 20
        });

        const orders = response.data;
        
        const results = orders.map((order: any) => {
            const numeClient = order.billing?.first_name ? `${order.billing.first_name} ${order.billing.last_name || ''}`.trim() : 'Client';
            const phone = order.billing?.phone || '';
            
            // Format Data
            const dateObj = new Date(order.date_created);
            const formatZ = (n: number) => n < 10 ? '0' + n : n.toString();
            const dataComenzii = `${formatZ(dateObj.getDate())}/${formatZ(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
            
            // Format Produs
            const numeAparat = order.line_items && order.line_items.length > 0 ? order.line_items[0].name : 'Echipament';

            return {
                id: order.id,
                nume_client: numeClient,
                phone: phone,
                data_comenzii: dataComenzii,
                nume_aparat: numeAparat,
                city: order.billing?.city || ''
            };
        });

        // Deduplication against multiple orders by same phone number (keeping the most recent)
        const uniqueResultsMap = new Map();
        for (const res of results) {
            // Un om poate avea mai multe comenzi (căutăm unicitatea după nr telefon, astfel încât pe UI să iasă o singură propunere ptr acel SMS)
            if (res.phone && !uniqueResultsMap.has(res.phone)) {
                uniqueResultsMap.set(res.phone, res);
            }
        }

        return NextResponse.json({
            success: true,
            results: Array.from(uniqueResultsMap.values())
        });

    } catch (error: any) {
        console.error('Error fetching SMS audience target search', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
