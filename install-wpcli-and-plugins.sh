#!/bin/bash

# Script pentru instalare WP-CLI și plugins în WordPress ClimaticPro
set -e

CONTAINER="climaticpro-wordpress-1"

echo "🔧 Installing WP-CLI in WordPress container..."

# Instalare WP-CLI
docker exec $CONTAINER bash -c "curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
    chmod +x wp-cli.phar && \
    mv wp-cli.phar /usr/local/bin/wp"

# Verificare instalare
echo "✅ WP-CLI installed successfully!"
docker exec $CONTAINER wp --info --allow-root

echo ""
echo "📦 Installing FREE plugins..."

# WPGraphQL
docker exec $CONTAINER wp plugin install wp-graphql --activate --allow-root || true

# WPGraphQL for ACF
docker exec $CONTAINER wp plugin install wpgraphql-acf --activate --allow-root || true

# Redis Object Cache
docker exec $CONTAINER wp plugin install redis-cache --activate --allow-root || true

echo ""
echo "📦 Installing PRO plugins from ZIP files..."

# ACF Pro
if docker exec $CONTAINER test -f /var/www/html/wp-content/plugins/advanced-custom-fields-pro-6.3.12.zip; then
    echo "Installing ACF Pro..."
    docker exec $CONTAINER wp plugin install /var/www/html/wp-content/plugins/advanced-custom-fields-pro-6.3.12.zip --activate --allow-root || true
fi

# Rank Math Pro
if docker exec $CONTAINER test -f /var/www/html/wp-content/plugins/seo-by-rank-math-pro-3.0.97.zip; then
    echo "Installing Rank Math Pro..."
    docker exec $CONTAINER wp plugin install /var/www/html/wp-content/plugins/seo-by-rank-math-pro-3.0.97.zip --activate --allow-root || true
fi

# Rank Math API Manager
if docker exec $CONTAINER test -f /var/www/html/wp-content/plugins/rank-math-api-manager-main.zip; then
    echo "Installing Rank Math API Manager..."
    docker exec $CONTAINER wp plugin install /var/www/html/wp-content/plugins/rank-math-api-manager-main.zip --activate --allow-root || true
fi

# WPGraphQL for WooCommerce
if docker exec $CONTAINER test -f /var/www/html/wp-content/plugins/wp-graphql-woocommerce-v0.19.0.zip; then
    echo "Installing WPGraphQL for WooCommerce..."
    docker exec $CONTAINER wp plugin install /var/www/html/wp-content/plugins/wp-graphql-woocommerce-v0.19.0.zip --activate --allow-root || true
fi

echo ""
echo "⚙️ Configuring WordPress..."

# Setare permalink structure
docker exec $CONTAINER wp rewrite structure '/%postname%/' --allow-root || true
docker exec $CONTAINER wp rewrite flush --allow-root || true

# Activare Redis cache
docker exec $CONTAINER wp redis enable --allow-root || true

# Setare timezone
docker exec $CONTAINER wp option update timezone_string 'Europe/Bucharest' --allow-root || true

# Dezactivare comentarii default
docker exec $CONTAINER wp option update default_comment_status 'closed' --allow-root || true

echo ""
echo "✅ Installed plugins:"
docker exec $CONTAINER wp plugin list --allow-root

echo ""
echo "✅ WordPress setup complete!"
echo "🌐 Access WordPress: https://cms.climaticpro.ro/wp-admin/"
echo "📊 GraphQL endpoint: https://cms.climaticpro.ro/graphql"
