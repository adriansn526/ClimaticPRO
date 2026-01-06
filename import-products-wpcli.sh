#!/bin/bash
# Import produse WooCommerce prin WP-CLI
# Bypass-ează complet interfața WordPress Admin

CONTAINER="climaticpro-wordpress-1"
EXPORT_DIR="/home/asns/projects/climaticpro/export"

echo "🚀 Import produse WooCommerce prin WP-CLI..."
echo "============================================"

# Import primele 5 produse pentru test
cat $EXPORT_DIR/products.json | jq -c '.[]' | head -5 | while read product; do
    name=$(echo $product | jq -r '.name')
    sku=$(echo $product | jq -r '.sku // ""')
    price=$(echo $product | jq -r '.regular_price // ""')
    desc=$(echo $product | jq -r '.description // ""' | head -c 200)
    
    echo ""
    echo "📦 Creating: $name"
    
    # Creare produs prin WP-CLI
    docker exec $CONTAINER wp wc product create \
        --name="$name" \
        --type="simple" \
        --regular_price="$price" \
        --sku="$sku" \
        --status="draft" \
        --description="$desc" \
        --user=1 \
        --allow-root 2>&1 | grep -E "Success|Error|Created"
    
    sleep 1
done

echo ""
echo "============================================"
echo "✅ Import test complet!"
echo "Verifică produsele în WooCommerce → Products"
