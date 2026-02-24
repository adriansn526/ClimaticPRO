<?php
/**
 * Fix ACF Gallery Field Type
 * Sterge grupul existent si il recreeaza pentru a forta tipul Gallery.
 */

define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

echo "=== FIX: Recreare ACF Gallery Field ===\n\n";

if (!function_exists('acf_add_local_field_group')) {
    die("ERROR: ACF Pro nu este activ!\n");
}

// 1. Cauta grupul existent
$existing_posts = get_posts(array(
    'post_type' => 'acf-field-group',
    'title' => 'Bannere Gallery System',
    'posts_per_page' => -1 
));

if ($existing_posts) {
    foreach ($existing_posts as $p) {
        echo "⚠️ S-a gasit grupul vechi (ID: {$p->ID}). Il stergem...\n";
        wp_delete_post($p->ID, true);
    }
    echo "✅ Toate grupurile vechi au fost sterse.\n\n";
} else {
    echo "ℹ️ Nu s-a gasit niciun grup existent.\n\n";
}

// 2. Defineste Field Group (Code IDENTIC cu cel anterior)
$field_group = array(
    'key' => 'group_bannere_gallery_system',
    'title' => 'Bannere Gallery System',
    'fields' => array(
        array(
            'key' => 'field_hero_gallery',
            'label' => 'Hero Gallery',
            'name' => 'hero_gallery',
            'type' => 'gallery', // Explicit GALLERY
            'instructions' => 'Add multiple images for the slider. (Force Gallery)',
            'required' => 0,
            'conditional_logic' => 0,
            'return_format' => 'array',
            'library' => 'all',
            'min' => 1,
            'max' => 10,
            'preview_size' => 'medium',
            'show_in_graphql' => 1,
            'graphql_field_name' => 'heroGallery',
        ),
        array(
            'key' => 'field_banner_active',
            'label' => 'Activ',
            'name' => 'is_active',
            'type' => 'true_false',
            'instructions' => 'Check to make this the active banner set for the homepage.',
            'default_value' => 0,
            'show_in_graphql' => 1,
            'graphql_field_name' => 'isActive',
        )
    ),
    'location' => array(
        array(
            array(
                'param' => 'post_type',
                'operator' => '==',
                'value' => 'bannere',
            ),
        ),
    ),
    'active' => true,
    'show_in_graphql' => 1,
    'graphql_field_name' => 'bannereGallerySystem',
);

// 3. Re-inregistreaza si Salveaza
acf_add_local_field_group($field_group);

$post_id = wp_insert_post(array(
    'post_title'    => 'Bannere Gallery System',
    'post_content'  => serialize($field_group),
    'post_status'   => 'publish',
    'post_type'     => 'acf-field-group',
));

if (is_wp_error($post_id)) {
    echo "ERROR: " . $post_id->get_error_message() . "\n";
} else {
    echo "✅ Field Group RECREAT cu ID: {$post_id}\n";
    update_post_meta($post_id, 'show_in_graphql', 1);
    update_post_meta($post_id, 'graphql_field_name', 'bannereGallerySystem');
}

echo "\n=== FIX Complet ===\n";
echo "Verifica acum in Admin > Bannere.\n";
