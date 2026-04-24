import { NextResponse } from 'next/server';
import { createWooCommerceOrder } from '@/lib/woocommerce';
import { getPrisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            firstName, lastName, email, phone,
            street, number, building, apartment, sector, intercom,
            selectedDate, quantity, serviceName, serviceTotal, servicesList,
            billingType, companyName, cui, regCom, observations,
            isMaintenance, createAccount, password
        } = body;

        let displayDate = 'Urmează să stabilim';
        if (selectedDate) {
            try {
                const d = new Date(selectedDate);
                displayDate = d.toLocaleDateString('ro-RO', {
                    timeZone: 'Europe/Bucharest',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
            } catch (e) {
                displayDate = selectedDate;
            }
        }

        const qty = quantity || 1;

        // Validare Preț Dinamic din Baza de Date
        let calculatedTotal = serviceTotal || 0;
        try {
            const prisma = getPrisma();
            const pricingSetting = await prisma.appSetting.findUnique({ where: { key: 'global_pricing_override' } });
            if (pricingSetting && pricingSetting.value && !serviceTotal) {
                const parsed = JSON.parse(pricingSetting.value);
                const snLow = serviceName?.toLowerCase() || '';
                let t = 0;
                if (snLow.includes('igienizare')) t += (parsed.maintenancePrice || 150);
                if (snLow.includes('repara')) t += (parsed.repairPrice || 100);
                if (t === 0) t = 100;
                calculatedTotal = t * qty;
            }
        } catch (e) {
            console.error('Pricing fallback for maintenance.', e);
        }

        let finalCustomerId = 0;

        if (createAccount && password) {
            try {
                const baseUrl = (process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql').replace('/graphql', '/wp-json');
                const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
                const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
                
                const createUrl = `${baseUrl}/wc/v3/customers?consumer_key=${key}&consumer_secret=${secret}`;
                const custResponse = await fetch(createUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        password,
                        billing: { first_name: firstName, last_name: lastName, company: companyName || '', address_1: street, city: 'Bucuresti', email, phone }
                    })
                });

                const custData = await custResponse.json();

                if (custResponse.ok && custData.id) {
                    finalCustomerId = custData.id;
                } else if (custData.code === 'registration-error-email-exists') {
                    // Email exists -> Fetch and link to old account
                    const getUrl = `${baseUrl}/wc/v3/customers?email=${encodeURIComponent(email)}&consumer_key=${key}&consumer_secret=${secret}`;
                    const getReq = await fetch(getUrl);
                    const getResp = await getReq.json();
                    if (getReq.ok && getResp.length > 0) {
                        finalCustomerId = getResp[0].id;
                    }
                }
            } catch(e) {
                console.error("Error creating/linking customer:", e);
            }
        }

        // Construct WooCommerce Order Payload
        const orderPayload = {
            status: 'processing',
            customer_id: finalCustomerId || 0,
            payment_method: 'cod',
            payment_method_title: 'Plata la Intervenție',
            set_paid: false,
            billing: {
                first_name: firstName,
                last_name: lastName,
                company: billingType === 'juridica' ? `${companyName} (CUI: ${cui}${regCom ? ', RegCom: ' + regCom : ''})` : '',
                address_1: `${street} ${number}, ${building ? 'Bl. ' + building : ''} ${apartment ? 'Ap. ' + apartment : ''}`,
                address_2: `Interfon: ${intercom || '-'}`,
                city: 'București',
                state: sector?.replace('Sector', 'S').trim(), 
                postcode: '',
                country: 'RO',
                email: email,
                phone: phone
            },
            shipping: {
                first_name: firstName,
                last_name: lastName,
                address_1: `${street} ${number}`,
                city: 'București',
                country: 'RO'
            },
            // For maintenance, we don't have a rigid catalog product ID usually, 
            // so we add it via line_items to bypass the product strictness and ensure Mobile App compatibility
            line_items: (servicesList && Array.isArray(servicesList) && servicesList.length > 0) 
              ? servicesList.map(srv => ({
                  product_id: 11170,
                  name: `Serviciu: ${srv.name}`,
                  quantity: srv.quantity,
                  subtotal: String(srv.price * srv.quantity),
                  total: String(srv.price * srv.quantity)
              }))
              : [
                  {
                      product_id: 11170,
                      name: `Serviciu: ${serviceName} x ${qty} buc`,
                      subtotal: String(calculatedTotal),
                      total: String(calculatedTotal)
                  }
              ],
            // Set Origin
            created_via: 'climaticpro_maintenance_wizard',
            customer_user_agent: request.headers.get('user-agent') || 'ClimaticPRO Maintenance Wizard',

            meta_data: [
                {
                    key: 'appointment_date',
                    value: selectedDate
                },
                {
                    key: 'programare_mentenanta',
                    value: selectedDate
                },
                {
                    key: '_is_maintenance',
                    value: 'yes'
                }
            ],
            customer_note: `Programare Mentenanță (${serviceName}): ${selectedDate}. Nr. Aparate: ${qty}. Obs: ${observations || '-'}`
        };

        const result = await createWooCommerceOrder(orderPayload);

        if (result.success) {
            return NextResponse.json({ success: true, orderId: result.order?.id || result.id });
        } else {
            return NextResponse.json({ success: false, error: result.error || 'Nu s-a putut crea comanda.' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Eroare creare comanda mentenanta:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Nu s-a putut trimite comanda.' 
        }, { status: 500 });
    }
}
