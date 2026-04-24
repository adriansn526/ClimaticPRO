import { NextResponse } from 'next/server';

const getBaseUrl = () => {
    return (process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql').replace('/graphql', '/wp-json');
};

const getAuthParams = () => {
    const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
    if (!key || !secret) throw new Error('WooCommerce Credentials Missing');
    return `consumer_key=${key}&consumer_secret=${secret}`;
};

export async function getWooCommerceOrders(params: any = {}) {
    try {
        const baseUrl = getBaseUrl();
        const auth = getAuthParams();

        // Build query string
        const query = new URLSearchParams(params);

        const url = `${baseUrl}/wc/v3/orders?${auth}&${query.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Host': 'cms.climaticpro.ro',
                'X-Forwarded-Proto': 'https'
            },
            next: { revalidate: 60, tags: ['woo-orders'] } // Cache 60s, tagged for on-demand revalidation
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching Woo orders:', error);
        return [];
    }
}

export async function updateWooCommerceOrder(orderId: number, data: any) {
    try {
        const baseUrl = getBaseUrl();
        const auth = getAuthParams();
        const url = `${baseUrl}/wc/v3/orders/${orderId}?${auth}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'cms.climaticpro.ro',
                'X-Forwarded-Proto': 'https'
            },
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Update failed');
        }

        return json;
    } catch (error) {
        console.error(`Error updating order ${orderId}:`, error);
        throw error;
    }
}

export async function deleteWooCommerceOrder(orderId: number) {
    try {
        const baseUrl = getBaseUrl();
        const auth = getAuthParams();
        const url = `${baseUrl}/wc/v3/orders/${orderId}?${auth}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Host': 'cms.climaticpro.ro',
                'X-Forwarded-Proto': 'https'
            }
        });

        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Delete failed');
        }

        return json;
    } catch (error) {
        console.error(`Error deleting order ${orderId}:`, error);
        throw error;
    }
}

export async function getWooCommerceProducts(params: any = {}) {
    try {
        const baseUrl = getBaseUrl();
        const auth = getAuthParams();
        const query = new URLSearchParams(params);

        const url = `${baseUrl}/wc/v3/products?${auth}&${query.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Host': 'cms.climaticpro.ro',
                'X-Forwarded-Proto': 'https'
            },
            next: { revalidate: 0 } // No Cache for Dev
        });

        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    } catch (error) {
        console.error('Error fetching Woo products:', error);
        return [];
    }
}

export async function getWooCommerceCategories(params: any = {}) {
    try {
        const baseUrl = getBaseUrl();
        const auth = getAuthParams();
        const query = new URLSearchParams(params);

        const url = `${baseUrl}/wc/v3/products/categories?${auth}&${query.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Host': 'cms.climaticpro.ro',
                'X-Forwarded-Proto': 'https'
            },
            next: { revalidate: 3600 } // Cache 1 hour
        });

        if (!response.ok) throw new Error('Failed to fetch categories');
        return await response.json();
    } catch (error) {
        console.error('Error fetching Woo categories:', error);
        return [];
    }
}

export async function updateWooCommerceProduct(productId: number, data: any) {
    try {
        const baseUrl = getBaseUrl();
        const auth = getAuthParams();
        const url = `${baseUrl}/wc/v3/products/${productId}?${auth}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'cms.climaticpro.ro',
                'X-Forwarded-Proto': 'https'
            },
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Product Update failed');
        }

        return json;
    } catch (error) {
        console.error(`Error updating product ${productId}:`, error);
        throw error;
    }
}
