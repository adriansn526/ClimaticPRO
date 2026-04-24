import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

export async function getAudiencePhones(type: string, param: string): Promise<any[]> {
    if (type === 'individual' && param) {
        // Just clean and return the single number
        let cleanPhone = param.replace(/[\s-]/g, '');
        if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
            cleanPhone = '+40' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('40') && cleanPhone.length === 11) {
            cleanPhone = '+' + cleanPhone;
        }
        const cPhone = cleanPhone.replace('+', '');
        return [{
            phone: cPhone,
            nume_client: 'Client',
            data_comenzii: new Date().toLocaleDateString('ro-RO'),
            nume_aparat: 'Produs'
        }];
    }

    const WooCommerce = new WooCommerceRestApi({
        url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms.climaticpro.ro',
        consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
        consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
        version: 'wc/v3',
    });

    if (type === 'manual_selection' && param) {
        let orderIds: number[] = [];
        try {
            orderIds = JSON.parse(param);
        } catch (e) {
            return [];
        }
        
        if (!Array.isArray(orderIds) || orderIds.length === 0) return [];

        const response = await WooCommerce.get('orders', {
            include: orderIds.join(','),
            per_page: 100
        });

        const orders = response.data;
        const manualPhones: any[] = [];

        for (const order of orders) {
            const phoneField = order.billing?.phone;
            if (phoneField) {
                let cleanPhone = phoneField.replace(/[\s-]/g, '');
                if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
                    cleanPhone = '+40' + cleanPhone.substring(1);
                } else if (cleanPhone.startsWith('40') && cleanPhone.length === 11) {
                    cleanPhone = '+' + cleanPhone;
                }

                if (cleanPhone.startsWith('+40')) {
                    let e164Phone = cleanPhone.replace('+', '');
                    
                    const numeClient = order.billing?.first_name ? `${order.billing.first_name} ${order.billing.last_name || ''}`.trim() : 'Client';
                    const dateObj = new Date(order.date_created);
                    const formatZ = (n: number) => n < 10 ? '0' + n : n.toString();
                    const dataComenzii = `${formatZ(dateObj.getDate())}/${formatZ(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
                    const numeAparat = order.line_items && order.line_items.length > 0 ? order.line_items[0].name : 'Echipament';

                    manualPhones.push({
                        phone: e164Phone,
                        nume_client: numeClient,
                        data_comenzii: dataComenzii,
                        nume_aparat: numeAparat
                    });
                }
            }
        }
        
        // Deduplicate
        const uniquePhonesMap = new Map();
        for (const p of manualPhones) {
            if (!uniquePhonesMap.has(p.phone)) {
                uniquePhonesMap.set(p.phone, p);
            }
        }
        return Array.from(uniquePhonesMap.values());
    }

    const phones: any[] = [];
    let page = 1;
    let hasMore = true;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    while (hasMore) {
        const response = await WooCommerce.get('orders', {
            status: 'completed',
            per_page: 100,
            page: page
        });

        const orders = response.data;
        if (orders.length === 0) {
            hasMore = false;
            break;
        }

        for (const order of orders) {
            let includeOrder = false;

            if (type === 'toata_baza' || !type) {
                includeOrder = true;
            } else if (type === 'b2b') {
                if (order.billing?.company && order.billing.company.trim() !== '') {
                    includeOrder = true;
                }
            } else if (type === 'recent') {
                if (new Date(order.date_created) >= thirtyDaysAgo) {
                    includeOrder = true;
                }
            } else if (type === 'vechi') {
                if (new Date(order.date_created) <= oneYearAgo) {
                    includeOrder = true;
                }
            } else if (type === 'geografic') {
                const state = (order.billing?.state || '').toLowerCase();
                const city = (order.billing?.city || '').toLowerCase();
                const target = (param || '').toLowerCase();

                // WooCommerce states for RO usually: B (Bucuresti), IF (Ilfov), CJ (Cluj), etc.
                if (target && (city.includes(target) || state.includes(target) || (target === 'bucuresti' && state === 'b') || (target === 'ilfov' && state === 'if') || (target === 'cluj' && state === 'cj') || (target === 'timis' && state === 'tm') || (target === 'iasi' && state === 'is') || (target === 'constanta' && state === 'ct') || (target === 'brasov' && state === 'bv'))) {
                    includeOrder = true;
                }
            } else if (type === 'montaj_inclus') {
                // Check line items for "montaj" or "instalare"
                if (order.line_items) {
                    for (const item of order.line_items) {
                        const name = (item.name || '').toLowerCase();
                        if (name.includes('montaj') || name.includes('instalare')) {
                            includeOrder = true;
                            break;
                        }
                    }
                }
            }

            if (includeOrder) {
                const phoneField = order.billing?.phone;
                if (phoneField) {
                    let cleanPhone = phoneField.replace(/[\s-]/g, '');
                    if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
                        cleanPhone = '+40' + cleanPhone.substring(1);
                    } else if (cleanPhone.startsWith('40') && cleanPhone.length === 11) {
                        cleanPhone = '+' + cleanPhone;
                    }

                    if (cleanPhone.startsWith('+40')) {
                        let e164Phone = cleanPhone.replace('+', '');
                        
                        const numeClient = order.billing?.first_name ? `${order.billing.first_name} ${order.billing.last_name || ''}`.trim() : 'Client';
                        const dateObj = new Date(order.date_created);
                        const formatZ = (n: number) => n < 10 ? '0' + n : n.toString();
                        const dataComenzii = `${formatZ(dateObj.getDate())}/${formatZ(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
                        const numeAparat = order.line_items && order.line_items.length > 0 ? order.line_items[0].name : 'Echipament';

                        phones.push({
                            phone: e164Phone,
                            nume_client: numeClient,
                            data_comenzii: dataComenzii,
                            nume_aparat: numeAparat
                        });
                    }
                }
            }
        }
        page++;
    }

    // Deduplicate by phone number prioritizing most recent orders
    const uniquePhonesMap = new Map();
    for (const p of phones) {
        if (!uniquePhonesMap.has(p.phone)) {
            uniquePhonesMap.set(p.phone, p);
        }
    }
    return Array.from(uniquePhonesMap.values());
}
