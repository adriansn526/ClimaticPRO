
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getPostHogClient } from '@/lib/posthog-server';

const TBI_LIVE_URL = 'https://tbicp.com';
const PUBLIC_KEY_PATH = path.join(process.cwd(), 'lib/tbi/public.key');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, total, customer, items } = body;

        // 1. Get Environment Variables
        const unicid = process.env.TBI_UNICID;
        const storeId = process.env.TBI_STORE_ID;
        const username = process.env.TBI_USERNAME;
        const password = process.env.TBI_PASSWORD;

        if (!unicid || !storeId || !username || !password) {
            return NextResponse.json({ error: 'TBI configuration missing' }, { status: 500 });
        }

        // 2. Get Parameters from TBI
        const paramsResponse = await fetch(`${TBI_LIVE_URL}/function/getparameters.php?cid=${unicid}`);
        const params = await paramsResponse.json();

        if (!params || params.tbi_status !== 'Yes') {
            return NextResponse.json({ error: 'TBI unavailable' }, { status: 503 });
        }

        // 3. Prepare First Payload (Add Order to TBI CP)
        // Note: The callback URL should be your actual handling URL
        const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/tbi/callback`;

        const tbiItems = items.map((item: any, index: number) => ({
            name: item.name,
            qty: String(item.quantity),
            price: String(item.price), // Unit price
            category: String(item.categoryId || 0),
            sku: String(item.productId),
            ImageLink: item.image || ''
        }));

        const firstPayload = {
            store_id: storeId,
            order_id: String(orderId),
            type: 'TBI',
            back_ref: callbackUrl, // Checks status here
            order_total: total,
            username: username,
            password: password,
            customer: {
                fname: customer.firstName,
                lname: customer.lastName,
                cnp: '', // Optional/Not collected usually unless mandatory
                email: customer.email,
                phone: customer.phone,
                billing_address: customer.address,
                billing_city: customer.city,
                billing_county: customer.county,
                shipping_address: customer.address, // Simplifying for now
                shipping_city: customer.city,
                shipping_county: customer.county,
                person_type: '',
                net_income: '',
                instalments: ''
            },
            items: tbiItems
        };

        // Send First POST
        const formBody = new URLSearchParams();
        // Recursive function to append nested objects to URLSearchParams not needed as URLSearchParams doesn't support nested objects cleanly like PHP's http_build_query for arrays sometimes?
        // Wait, PHP http_build_query handles nested arrays (items[0][name]=...). Node's URLSearchParams does NOT.
        // We need a custom serializer or use a library, or just manually format it.
        // Actually, let's look at how we can send this. `application/x-www-form-urlencoded`.

        // Simple flattener for form-data
        const buildFormData = (data: any, parentKey?: string) => {
            const params = new URLSearchParams();
            // This is complex to implement correctly manually. 
            // Better to use a simpler approach or a verifying fetch.
            // Let's use a simple object -> Params conversion loop if possible, or qs library if available?
            // "qs" is not installed.

            // Let's rely on JSON for debugging but TBI expects form-data.
            // I will implement a recursive builder.
            const build = (obj: any, prefix?: string) => {
                if (typeof obj === 'object' && obj !== null) {
                    Object.keys(obj).forEach(key => {
                        build(obj[key], prefix ? `${prefix}[${key}]` : key);
                    });
                } else {
                    formBody.append(prefix!, String(obj));
                }
            };
            build(data);
        };
        buildFormData(firstPayload);

        const addOrderResponse = await fetch(`${TBI_LIVE_URL}/function/addorders.php?cid=${unicid}`, {
            method: 'POST',
            body: formBody,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const addOrderResult = await addOrderResponse.json();

        if (addOrderResult.status !== 'Yes') {
            return NextResponse.json({ error: 'Failed to create TBI order', details: addOrderResult }, { status: 400 });
        }

        // 4. Prepare Second Payload (For SoftInteligens / Encrypted)
        const secondPayload = {
            store_id: storeId,
            order_id: addOrderResult.newid, // Use the ID from TBI
            back_ref: callbackUrl,
            order_total: total,
            username: username,
            password: password,
            avalonorderid: String(orderId), // Original Order ID
            customer: firstPayload.customer,
            items: tbiItems
        };

        const plainText = JSON.stringify(secondPayload);

        // Encrypt with Public Key
        const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
        const buffer = Buffer.from(plainText, 'utf8');
        const key = crypto.createPublicKey(publicKey);
        const keyDetails = key.asAsymmetricKeyDetails();
        const modulusBits = keyDetails?.modulusLength || 2048; // Default to 2048 if undetected
        const chunkSize = Math.ceil(modulusBits / 8) - 11; // PKCS#1 v1.5 padding

        let encryptedParts = '';
        for (let i = 0; i < buffer.length; i += chunkSize) {
            const chunk = buffer.subarray(i, i + chunkSize);
            const encryptedChunk = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_PADDING,
                },
                chunk
            );
            encryptedParts += encryptedChunk.toString('binary'); // Mimic PHP's concatenation logic
        }

        const finalPayload = Buffer.from(encryptedParts, 'binary').toString('base64');
        const targetUrl = params.tbi_testenv == 1 ? params.tbi_testurl : params.tbi_liveurl;

        // 5. Send Second POST (Multipart/Form-Data)
        const formDataStep2 = new FormData();
        formDataStep2.append('order_data', finalPayload);
        formDataStep2.append('providerCode', 'avast');

        const finalResponse = await fetch(targetUrl, {
            method: 'POST',
            body: formDataStep2,
            redirect: 'manual' // We need to catch the 302/301
        });

        // Fetch using 'manual' redirect returns an opaque response usually, or we examine headers.
        // Node fetch with redirect: manual should return the response without following.
        const location = finalResponse.headers.get('location');

        if (location) {
            const posthog = getPostHogClient();
            posthog.capture({
                distinctId: customer?.email || `order_${orderId}`,
                event: 'tbi_financing_initiated',
                properties: {
                    order_id: orderId,
                    total,
                    currency: 'RON',
                    item_count: items?.length || 0,
                    source: 'api',
                },
            });
            await posthog.shutdown();

            return NextResponse.json({ redirectUrl: location });
        } else {
            // Sometimes it might return content if not redirecting?
            const text = await finalResponse.text();
            return NextResponse.json({ error: 'No redirect URL received', debug: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error('TBI Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
