<?php
/**
 * Fix toate problemele: GraphQL ACF + verificare bannere
 */

define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

echo "=== Fix GraphQL ACF Field Group ===\n\n";

// Găsește field group
$field_group_id = 435;

// Activează GraphQL pentru field group
update_post_meta($field_group_id, 'show_in_graphql', 1);
update_post_meta($field_group_id, 'graphql_field_name', 'bannerePaginaClimatizare');

echo "✅ GraphQL activat pentru field group ID {$field_group_id}\n";

// Găsește field-ul și activează GraphQL
global $wpdb;
$field_id = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'acf-field' AND post_excerpt = 'field_bannere_hero' ORDER BY ID DESC LIMIT 1");

if ($field_id) {
    update_post_meta($field_id, 'show_in_graphql', 1);
    update_post_meta($field_id, 'graphql_field_name', 'bannereHero');
    echo "✅ GraphQL activat pentru field ID {$field_id}\n";
}

// Verifică bannere în pagina 395
$bannere = get_field('bannere_hero', 395);

echo "\n=== Verificare Bannere Pagina 395 ===\n";

if ($bannere && is_array($bannere)) {
    echo "✅ Găsite " . count($bannere) . " imagini:\n\n";
    foreach ($bannere as $index => $image) {
        echo "Banner " . ($index + 1) . ":\n";
        echo "  - ID: " . $image['ID'] . "\n";
        echo "  - URL: " . $image['url'] . "\n";
        echo "  - Alt: " . ($image['alt'] ?: 'N/A') . "\n";
        echo "  - Width: " . $image['width'] . "px\n";
        echo "  - Height: " . $image['height'] . "px\n\n";
    }
} else {
    echo "❌ Nu sunt imagini în galerie\n";
}

echo "\n=== Flush GraphQL Schema ===\n";

// Flush GraphQL schema cache
if (function_exists('graphql_clear_schema')) {
    graphql_clear_schema();
    echo "✅ GraphQL schema cleared\n";
}

// Flush WordPress cache
wp_cache_flush();
echo "✅ WordPress cache flushed\n";

echo "\n✅ Toate fix-urile aplicate!\n";
