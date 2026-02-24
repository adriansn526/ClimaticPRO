import { NextResponse } from 'next/server';
import { createWooCommerceOrder } from '@/lib/woocommerce';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Destructure body from CheckoutPage
        const {
            firstName, lastName, email, phone,
            personType, cui, companyName, regCom,
            billingAddress, billingCity, billingCounty, billingPostalCode,
            shippingMethod, shippingAddress, shippingCity, shippingCounty, shippingPostalCode, differentShipping,
            paymentMethod,
            items,
            notes
        } = body;

        // Construct billing info
        const billing = {
            first_name: firstName,
            last_name: lastName,
            address_1: billingAddress,
            city: billingCity,
            state: billingCounty, // Check if WC expects code or name
            postcode: billingPostalCode,
            country: 'RO',
            email: email,
            phone: phone,
            company: personType === 'juridica' ? companyName : ''
        };

        // Construct shipping info
        let shipping = {
            first_name: firstName,
            last_name: lastName,
            address_1: billingAddress,
            city: billingCity,
            state: billingCounty,
            postcode: billingPostalCode,
            country: 'RO',
            company: personType === 'juridica' ? companyName : ''
        };

        if (shippingMethod === 'delivery' && differentShipping) {
            shipping = {
                ...shipping,
                address_1: shippingAddress,
                city: shippingCity,
                state: shippingCounty,
                postcode: shippingPostalCode
            };
        }

        // Map line items
        const line_items = items.map((item: any) => ({
            product_id: item.product?.databaseId || item.product?.id, // Use databaseId if available, fallback to id
            quantity: item.quantity
        }));

        // Meta data
        const meta_data = [
            { key: '_created_via', value: 'climaticpro_checkout' },
            { key: '_payment_method_title', value: paymentMethod === 'cash' ? 'Ramburs' : paymentMethod === 'transfer' ? 'Transfer Bancar' : 'Card' }
        ];

        if (personType === 'juridica') {
            meta_data.push({ key: 'CUI', value: cui });
            meta_data.push({ key: 'RegCom', value: regCom });
            meta_data.push({ key: '_billing_cui', value: cui }); // Standard for some plugins
        }

        // Construct WooCommerce Order Payload
        const orderPayload = {
            payment_method: paymentMethod === 'cash' ? 'cod' : 'bacs', // cod = Cash on Delivery, bacs = Direct Bank Transfer
            payment_method_title: paymentMethod === 'cash' ? 'Plata la Livrare' : 'Transfer Bancar',
            set_paid: false,
            billing,
            shipping,
            line_items,
            meta_data,
            customer_note: notes || ''
        };

        // If payment is card, we might need other logic, but for now we set it as Pending
        if (paymentMethod === 'card') {
            // Placeholder: usually you redirect to Stripe/Netopia here.
            // For now, treat as order created but pending payment.
            orderPayload.payment_method = 'card';
            orderPayload.payment_method_title = 'Card Bancar';
        }

        const result = await createWooCommerceOrder(orderPayload);

        if (result.success) {
            // Send confirmation email
            await sendOrderConfirmationEmail({
                orderId: result.order.id,
                customerName: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                address: differentShipping ? `${shippingAddress}, ${shippingCity}, ${shippingCounty}` : `${billingAddress}, ${billingCity}, ${billingCounty}`,
                date: 'Urmează să te contactăm', // Placeholder or use order date
                products: items.map((item: any) => ({
                    name: item.product?.name || 'Produs',
                    quantity: item.quantity,
                    price: parseFloat(item.product?.price || '0')
                })),
                total: parseFloat(result.order.total || '0'),
                isInstallationOnly: false
            });

            return NextResponse.json({
                success: true,
                orderId: result.order.id,
                wooOrderId: result.order.id,
                message: 'Order created successfully'
            });
        } else {
            return NextResponse.json({ error: result.error || 'Failed to create order' }, { status: 500 });
        }

    } catch (error) {
        console.error('Error processing order:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
