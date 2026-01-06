import { NextRequest, NextResponse } from 'next/server';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

// WooCommerce API Client
const WooCommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms-climaticpro.asns.ro',
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  version: 'wc/v3',
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validare date
    if (!data.selectedDate || !data.firstName || !data.lastName || !data.phone || !data.email) {
      return NextResponse.json(
        { error: 'Date obligatorii lipsă' },
        { status: 400 }
      );
    }

    // Construire line items pentru WooCommerce
    const lineItems = [];

    // Adaugă produsul dacă a fost selectat
    if (!data.hasOwnDevice && data.selectedProduct) {
      lineItems.push({
        product_id: data.selectedProduct.id,
        name: data.selectedProduct.name,
        quantity: 1,
        price: data.selectedProduct.price.toString(),
        meta_data: [
          { key: 'BTU', value: data.selectedProduct.btu.toString() },
          { key: 'Clasa Energetica', value: data.selectedProduct.energyClass },
        ],
      });
    }

    // Adaugă serviciul de instalare (întotdeauna)
    lineItems.push({
      name: 'Instalare Aer Condiționat',
      quantity: 1,
      price: '1000',
      meta_data: [
        { key: 'Data Instalare', value: new Date(data.selectedDate).toLocaleDateString('ro-RO') },
        { key: 'Tip Camera', value: data.roomType },
        { key: 'Etaj', value: data.floor || 'N/A' },
        { key: 'Observatii', value: data.observations || 'N/A' },
      ],
    });

    // Creare comandă WooCommerce
    const orderData = {
      status: 'pending',
      billing: {
        first_name: data.firstName,
        last_name: data.lastName,
        address_1: `${data.street} ${data.number}`,
        address_2: data.building ? `Bl. ${data.building}, Ap. ${data.apartment || ''}` : '',
        city: 'București',
        state: data.sector,
        postcode: '',
        country: 'RO',
        email: data.email,
        phone: data.phone,
      },
      shipping: {
        first_name: data.firstName,
        last_name: data.lastName,
        address_1: `${data.street} ${data.number}`,
        address_2: data.building ? `Bl. ${data.building}, Ap. ${data.apartment || ''}` : '',
        city: 'București',
        state: data.sector,
        postcode: '',
        country: 'RO',
      },
      line_items: lineItems,
      customer_note: [
        `Data instalare: ${new Date(data.selectedDate).toLocaleDateString('ro-RO')}`,
        `Interfon: ${data.intercom || 'N/A'}`,
        data.observations ? `Observații: ${data.observations}` : '',
      ].filter(Boolean).join('\n'),
      meta_data: [
        { key: '_installation_date', value: data.selectedDate },
        { key: '_has_own_device', value: data.hasOwnDevice ? 'yes' : 'no' },
        { key: '_room_type', value: data.roomType },
        { key: '_floor', value: data.floor || '' },
        { key: '_intercom', value: data.intercom || '' },
        { key: '_marketing_accepted', value: data.marketingAccepted ? 'yes' : 'no' },
      ],
    };

    // Creare comandă în WooCommerce
    const response = await WooCommerce.post('orders', orderData);

    // Trimitere email confirmare (opțional - WooCommerce trimite automat)
    // Poți adăuga aici integrare cu Resend/Nodemailer pentru email custom

    return NextResponse.json({
      success: true,
      orderId: response.data.id,
      orderNumber: response.data.number,
      message: 'Comanda a fost plasată cu succes!',
    });

  } catch (error: any) {
    console.error('WooCommerce Order Error:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: 'Eroare la plasarea comenzii. Te rugăm să încerci din nou sau să ne contactezi telefonic.',
        details: error.response?.data?.message || error.message 
      },
      { status: 500 }
    );
  }
}
