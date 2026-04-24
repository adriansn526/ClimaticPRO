import { getWooCommerceCategories } from './lib/woocommerce';
async function test() {
   const cats = await getWooCommerceCategories();
   console.log(cats.slice(0, 2));
}
test();
