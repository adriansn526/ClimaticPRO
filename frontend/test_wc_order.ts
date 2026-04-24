import * as dotenv from 'dotenv';
dotenv.config();

// Mute NEXT_PUBLIC so it runs independently
import { createWooCommerceOrder } from './lib/woocommerce';

async function run() {
    const orderPayload = {
      payment_method: 'cod',
      payment_method_title: 'Plata la Intervenție',
      set_paid: false,
      billing: {
          first_name: 'Test',
          last_name: 'Testescu',
          address_1: 'Strada Testului 1',
          city: 'Bucuresti',
          country: 'RO',
          email: 'test@climaticpro.ro',
          phone: '0700000000'
      },
      line_items: [
          {
              product_id: 11170,
              name: 'Serviciu: Igienizare x 1 buc',
              subtotal: '150',
              total: '150'
          }
      ],
      created_via: 'climaticpro_maintenance_wizard'
    };

    console.log("Running createWooCommerceOrder...");
    const res = await createWooCommerceOrder(orderPayload);
    console.log("Result:", JSON.stringify(res, null, 2));
}

run();
