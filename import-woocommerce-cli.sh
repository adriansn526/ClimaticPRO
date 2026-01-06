#!/bin/bash
# Import WooCommerce data using WP-CLI and JSON files
set -e

CONTAINER="climaticpro-wordpress-1"
EXPORT_DIR="/home/asns/projects/climaticpro/export"

echo "🚀 Starting WooCommerce import via WP-CLI..."
echo "================================================"

# Import categorii
echo ""
echo "🏷️  Importing categories..."
cat $EXPORT_DIR/categories.json | jq -c '.[]' | while read cat; do
    name=$(echo $cat | jq -r '.name')
    slug=$(echo $cat | jq -r '.slug')
    desc=$(echo $cat | jq -r '.description // ""')
    
    docker exec $CONTAINER wp wc product_cat create \
        --name="$name" \
        --slug="$slug" \
        --description="$desc" \
        --user=1 \
        --allow-root 2>&1 | grep -E "Success|Error" || true
done

echo ""
echo "✅ Categories import complete!"

# Import atribute
echo ""
echo "🎨 Importing attributes..."
cat $EXPORT_DIR/attributes.json | jq -c '.[]' | head -10 | while read attr; do
    name=$(echo $attr | jq -r '.name')
    slug=$(echo $attr | jq -r '.slug')
    
    docker exec $CONTAINER wp wc product_attribute create \
        --name="$name" \
        --slug="$slug" \
        --user=1 \
        --allow-root 2>&1 | grep -E "Success|Error" || true
done

echo ""
echo "✅ First 10 attributes imported (total: 56)"

# Import produse (primele 10 pentru test)
echo ""
echo "📦 Importing first 10 products..."
cat $EXPORT_DIR/products.json | jq -c '.[]' | head -10 | while read product; do
    name=$(echo $product | jq -r '.name')
    sku=$(echo $product | jq -r '.sku // ""')
    price=$(echo $product | jq -r '.price // ""')
    
    docker exec $CONTAINER wp wc product create \
        --name="$name" \
        --sku="$sku" \
        --regular_price="$price" \
        --user=1 \
        --allow-root 2>&1 | grep -E "Success|Error" || true
done

echo ""
echo "================================================"
echo "✅ Import test complete!"
echo "📊 Imported: 10 products, categories, 10 attributes"
echo ""
echo "To import all data, run full import script"
