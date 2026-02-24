import subprocess
import json
import re

def run_wp_cli(args):
    """Run a WP-CLI command inside the docker container."""
    cmd = ["docker", "exec", "-u", "www-data", "climaticpro-wordpress-1", "php", "wp-cli.phar"] + args + ["--format=json"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        stdout = result.stdout.strip()
        match = re.search(r'(\{|\[)', stdout)
        if match:
            json_str = stdout[match.start():]
            return json.loads(json_str)
        return []
    except json.JSONDecodeError:
        return []

def get_all_attributes():
    return run_wp_cli(["wc", "product_attribute", "list", "--fields=id,slug,name", "--user=admin"])

def get_terms(attr_id):
    return run_wp_cli(["wc", "product_attribute_term", "list", str(attr_id), "--fields=id,name,slug,count", "--user=admin"])

if __name__ == "__main__":
    print("Scanning attributes for inconsistent slugs...")
    attributes = get_all_attributes()
    
    found_issues = False
    
    if attributes:
        for attr in attributes:
            # Only care about capacity related ones or all? User mentioned BTU.
            # Let's check all to be safe, but focus output.
            terms = get_terms(attr['id'])
            if not terms: continue
            
            for term in terms:
                slug = term['slug']
                name = term['name']
                t_id = term['id']
                
                # Check for "12000btu" (no hyphen) or "12000" (no btu suffix in slug but maybe in name?)
                # User specifically wants "12000-btu".
                # So we look for:
                # 1. digits + "btu" (joined)
                # 2. digits only (if name implies BTU)
                # 3. digits + "-" + digits + ... (weird ones?)
                
                # Regex for "12000btu"
                if re.match(r'^\d+btu$', slug):
                    print(f"[{attr['slug']}] ID {t_id}: Slug '{slug}' (Name: '{name}') -> Should be hyphenated?")
                    found_issues = True
                
                # Regex for "12000"
                if re.match(r'^\d+$', slug):
                    print(f"[{attr['slug']}] ID {t_id}: Slug '{slug}' (Name: '{name}') -> Missing units/hyphen?")
                    found_issues = True

                # Regex for "12000-btu" (The good one - just purely for context if we find duplicates)
                # We can check for duplicates: e.g. if we have 12000-btu AND 12000btu in the same tax.
    
    if not found_issues:
        print("No obvious inconsistent slugs found (checking for XXXXXbtu or XXXXX patterns).")
