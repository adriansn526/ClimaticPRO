
import subprocess
import json
import re

def run_wp_cli(args):
    """Run a WP-CLI command inside the docker container."""
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar"] + args + ["--format=json", "--user=admin"]
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Command failed with code {result.returncode}")
        print(f"STDERR: {result.stderr}")
        return None
    try:
        if not result.stdout.strip(): 
            print("Empty stdout")
            return None
        # Handle potential PHP warnings before JSON
        stdout = result.stdout.strip()
        print(f"DEBUG STDOUT (First 100 chars): {stdout[:100]}...")
        # Find start of JSON array or object, avoiding timestamped logs like [DATE]
        # We look for [{ or {" which indicates valid JSON content
        match = re.search(r'(\[\s*\{|\{\s*")', stdout)
        if match:
            json_str = stdout[match.start():]
            return json.loads(json_str) 
        # Fallback: try to find the last line that looks like JSON
        for line in reversed(stdout.splitlines()):
             if line.strip().startswith('[') or line.strip().startswith('{'):
                 try:
                     return json.loads(line)
                 except:
                     continue
        return None
    except:
        return None

def get_brands():
    return run_wp_cli(["wc", "product_attribute_term", "list", "2", "--fields=id,name,count"])

def get_products_in_term(term_id):
    # Use wp term list to see object IDs is tricky via wc api, better use wp eval
    # or just wc product list with filter
    # Actually, verify efficiently via SQL or wp eval
    php = f"""
    $ids = get_objects_in_term({term_id}, 'pa_brand');
    echo json_encode($ids);
    """
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar", "eval", php]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        # cleanup output
        stdout = res.stdout.strip()
        match = re.search(r'(\[)', stdout)
        if match:
            return json.loads(stdout[match.start():])
        return []
    except:
        return []

def assign_term(product_id, term_id):
    subprocess.run(["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar", 
                    "post", "term", "add", str(product_id), "pa_brand", str(term_id)], capture_output=True)

def delete_term(term_id):
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar", 
           "wc", "product_attribute_term", "delete", "2", str(term_id), "--force=true", "--user=admin"]
    print(f"Running delete: {' '.join(cmd)}")
    subprocess.run(cmd, capture_output=True)

def main():
    print("Fetching brands...")
    brands = get_brands()
    if not brands:
        print("No brands found.")
        return

    # Map ID -> Name
    brand_map = {int(b['id']): b['name'] for b in brands}
    
    # Find numeric names
    for b in brands:
        name = b['name']
        term_id = int(b['id'])
        
        # Check if name is numeric
        if re.match(r'^\d+$', name):
            target_id = int(name)
            
            # Check if valid target exists
            if target_id in brand_map:
                target_name = brand_map[target_id]
                print(f"Found Duplicate: Term {term_id} (Name='{name}') -> Target Term {target_id} (Name='{target_name}')")
                
                # Move products
                product_ids = get_products_in_term(term_id)
                print(f"  - Has {len(product_ids)} products.")
                
                if product_ids:
                    for pid in product_ids:
                        # Add to target term
                        assign_term(pid, target_id)
                        # print(f"    Product {pid} assigned to {target_name} ({target_id})")
                
                print(f"  - Deleting duplicate term {term_id}...")
                delete_term(term_id)
                print("  - Done.")
                
            else:
                print(f"WARNING: Term {term_id} has numeric name '{name}' but target ID {target_id} does not exist!")

if __name__ == "__main__":
    main()
