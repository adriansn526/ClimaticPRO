
import subprocess
import json
import re

# Brand Map from previous step
BRAND_MAP = {
    'yamato': 81, 'vivax': 568, 'zephir': 470, 'toshiba': 573, 'tcl': 569,
    'samsung': 58, 'nordstar': 31, 'mitsubishi heavy industries': 567, 
    'mitsubishi': 576, 'midea': 22, 'kyato': 281, 'hyundai': 36,
    'haier': 572, 'gree': 80, 'fujitsu': 459, 'eurocool': 571,
    'daikin': 483, 'conter breeze': 578, 'carrier': 581, 'bosch': 577, 'aux': 570,
    'vortex': 247
}

# Sort keys by length descending to match "Mitsubishi Heavy" before "Mitsubishi"
SORTED_BRANDS = sorted(BRAND_MAP.keys(), key=len, reverse=True)

def run_wp_cli(args):
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar"] + args + ["--format=json"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        if not result.stdout.strip(): return None
        return json.loads(result.stdout)
    except:
        return None

def set_product_brand(pid, brand_id):
    # wc product update doesn't easily set taxonomy terms via attributes without resetting others?
    # Actually, "wp post term set" is best.
    print(f"  [FIX] Product {pid}: Setting Brand ID {brand_id}...")
    subprocess.run(["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar", 
                    "post", "term", "set", str(pid), "pa_brand", str(brand_id)], capture_output=True)

def update_sku(pid, sku):
    print(f"  [SKU] Product {pid}: Setting SKU to '{sku}'...")
    run_wp_cli(["wc", "product", "update", str(pid), f"--sku={sku}"])

def get_products_without_brand():
    # Use wp eval to find IDs efficiently
    php_code = """
    global $wpdb; 
    $ids = $wpdb->get_results("SELECT ID, post_title FROM {$wpdb->posts} WHERE post_type='product' AND post_status='publish'"); 
    $out = [];
    foreach($ids as $obj) {
        $terms = wp_get_post_terms($obj->ID, 'pa_brand');
        if(empty($terms)) {
            $out[] = ['id' => $obj->ID, 'title' => $obj->post_title];
        }
    }
    echo json_encode($out);
    """
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar", "eval", php_code]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        start_json = result.stdout.find('[')
        if start_json == -1: return []
        return json.loads(result.stdout[start_json:])
    except:
        return []

def main():
    print("Fixing Brands & SKUs...")
    
    # 1. Fix Samsung SKU
    update_sku(8814, "AR12TXHQASINEU")
    
    # 2. Fix Brands
    products = get_products_without_brand()
    print(f"Found {len(products)} products without brand.")
    
    fixed_count = 0
    for p in products:
        pid = p['id']
        title = p['title'].lower()
        
        matched_brand_id = None
        for b_name in SORTED_BRANDS:
            if b_name in title:
                matched_brand_id = BRAND_MAP[b_name]
                print(f"  Product {pid}: '{p['title'][:40]}...' -> Detected '{b_name}'")
                break
        
        if matched_brand_id:
            set_product_brand(pid, matched_brand_id)
            fixed_count += 1
        else:
            print(f"  [WARN] Could not infer brand for Product {pid}: '{p['title']}'")
            
    print(f"Done. Fixed {fixed_count} brands.")

if __name__ == "__main__":
    main()
