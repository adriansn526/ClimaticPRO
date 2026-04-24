import { getWooCommerceCategories } from './lib/woocommerce';

async function run() {
    const cats = await getWooCommerceCategories();
    console.log(JSON.stringify(cats.slice(0, 3), null, 2));
}

run();
