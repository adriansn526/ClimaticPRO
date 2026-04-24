import { NextResponse } from 'next/server';
import { createWooCommerceOrder } from '@/lib/woocommerce';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { createCalendarEvent } from '@/lib/google-calendar';
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            firstName, lastName, email, phone,
            street, number, building, apartment, sector, intercom,
            selectedDate, selectedProduct, quantity: rawQuantity,
            billingType, companyName, cui, regCom, installationFee, selectedService
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

        const quantity = rawQuantity || 1;

        // Construct WooCommerce Order Payload
        const orderPayload = {
            payment_method: 'cod',
            payment_method_title: 'Plata la Livrare / Instalare',
            set_paid: false,
            billing: {
                first_name: firstName,
                last_name: lastName,
                company: billingType === 'juridica' ? `${companyName} (CUI: ${cui}${regCom ? ', RegCom: ' + regCom : ''})` : '',
                address_1: `${street} ${number}, ${building ? 'Bl. ' + building : ''} ${apartment ? 'Ap. ' + apartment : ''}`,
                address_2: `Interfon: ${intercom || '-'}`,
                city: 'București',
                state: sector?.replace('Sector', 'S').trim(), // Format often expected as S1, S2 etc.
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
            line_items: [
                ...(selectedProduct ? [{
                    product_id: selectedProduct?.databaseId || selectedProduct?.id,
                    quantity: quantity
                }] : []),
                // Always add Installation Product 11170
                {
                    product_id: 11170,
                    quantity: quantity
                }
            ],
            // Set Origin
            created_via: 'climaticpro_wizard',
            customer_user_agent: request.headers.get('user-agent') || 'ClimaticPRO Wizard',

            // Valid Metadata for Google Calendar Sync
            // Assuming generic plugin behavior, we send the date clearly
            meta_data: [
                {
                    key: 'appointment_date', // Common key
                    value: selectedDate
                },
                {
                    key: '_appointment_date', // Hidden meta key alternative
                    value: selectedDate
                },
                {
                    key: 'programare_instalare', // Custom readable key
                    value: selectedDate
                },
                {
                    key: '_referrer',
                    value: request.headers.get('referer') || 'Direct'
                },
                {
                    key: '_created_via',
                    value: 'climaticpro_wizard'
                }
            ],
            customer_note: `Programare Instalare: ${selectedDate}. Etaj: ${body.floor || '-'}, Obs: ${body.observations || '-'}`
        };

        const result = await createWooCommerceOrder(orderPayload);

        if (result.success) {
            // Send Confirmation Email (Non-blocking)
            const productPrice = selectedProduct?.price || 0;
            const installPrice = installationFee || 1000;
            
            // Calculate total for email
            const total = selectedProduct
                ? (selectedProduct.priceWithInstallation || (productPrice + installPrice)) * quantity
                : (installPrice * quantity);

            sendOrderConfirmationEmail({
                orderId: result.order.id,
                customerName: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                address: `${street} ${number}, ${sector}`,
                date: displayDate,
                products: [
                    ...(selectedProduct ? [{ name: selectedProduct.name, quantity: quantity, price: selectedProduct.price }] : []),
                    { name: `Servicii Instalare ${selectedService === 'premium' ? 'Premium' : 'Standard'}`, quantity: quantity, price: installPrice }
                ],
                total: total,
                isInstallationOnly: !selectedProduct
            }).catch(err => console.error('Background Email Error:', err));

            if (selectedDate) {
                createCalendarEvent({
                    summary: `Instalare AC - ${firstName} ${lastName}`,
                    description: `Comanda #${result.order.id}\nTelefon: ${phone}\nEmail: ${email}\nProdus: ${selectedProduct ? selectedProduct.name : 'Doar instalare'}\nAdresa: ${street} ${number}, ${building ? 'Bl. ' + building : ''} ${apartment ? 'Ap. ' + apartment : ''}, Interfon: ${intercom || '-'}\nEtaj: ${body.floor || '-'}\nCamera: ${body.roomType || '-'}\nObservatii: ${body.observations || '-'}`,
                    location: `${street} ${number}, ${sector}, București`,
                    date: selectedDate
                }).catch(err => console.error('Background Calendar Sync Error:', err));
            }

            return NextResponse.json({ success: true, orderId: result.order.id });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

    } catch (error) {
        console.error('API Order Error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
