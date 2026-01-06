#!/bin/bash

# Script pentru generare WooCommerce API keys în WordPress nou
set -e

CONTAINER="climaticpro-wordpress-1"

echo "🔑 Generating WooCommerce API keys..."

# Obține user ID (primul admin user)
USER_ID=$(docker exec $CONTAINER wp user list --role=administrator --field=ID --allow-root | head -1)

if [ -z "$USER_ID" ]; then
    echo "❌ No admin user found!"
    exit 1
fi

echo "👤 Using admin user ID: $USER_ID"

# Generare API keys prin database direct
echo "🔧 Creating API consumer..."

# Consumer key și secret (generate random)
CONSUMER_KEY="ck_$(openssl rand -hex 16)"
CONSUMER_SECRET="cs_$(openssl rand -hex 16)"

# Insert în database
docker exec $CONTAINER wp db query "
INSERT INTO wp_woocommerce_api_keys (user_id, description, permissions, consumer_key, consumer_secret, truncated_key, last_access)
VALUES (
    $USER_ID,
    'Import API - Auto Generated',
    'read_write',
    '$CONSUMER_KEY',
    '$CONSUMER_SECRET',
    SUBSTRING('$CONSUMER_KEY', -7),
    NULL
);" --allow-root

echo ""
echo "✅ WooCommerce API keys generated successfully!"
echo ""
echo "📋 Add these to import-woocommerce.py:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DEST_CONSUMER_KEY = \"$CONSUMER_KEY\""
echo "DEST_CONSUMER_SECRET = \"$CONSUMER_SECRET\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Salvare în fișier pentru referință
cat > /home/asns/projects/climaticpro/wc-api-keys.txt <<EOF
WooCommerce API Keys for cms.climaticpro.ro
Generated: $(date)

DEST_CONSUMER_KEY = "$CONSUMER_KEY"
DEST_CONSUMER_SECRET = "$CONSUMER_SECRET"

Add these to import-woocommerce.py script.
EOF

echo "💾 Keys also saved to: /home/asns/projects/climaticpro/wc-api-keys.txt"
