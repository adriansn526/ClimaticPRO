<?php
/**
 * Adaugare ACF Gallery Field pentru CPT Bannere
 */

define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

echo "=== Adaugare ACF Gallery pentru Bannere CPT ===\n\n";

if (!function_exists('acf_add_local_field_group')) {
    die("ERROR: ACF Pro nu este activ!\n");
}

// Definește Field Group
$field_group = array(
    'key' => 'group_bannere_gallery_system',
    'title' => 'Bannere Gallery System',
    'fields' => array(
        array(
            'key' => 'field_hero_gallery',
            'label' => 'Hero Gallery',
            'name' => 'hero_gallery',
            'type' => 'gallery',
            'instructions' => 'Add multiple images for the slider. The first image will be the main one if no slider logic is used.',
            'required' => 0,
            'conditional_logic' => 0,
            'return_format' => 'array',
            'library' => 'all',
            'min' => 1,
            'max' => 10,
            'min_width' => '',
            'min_height' => '',
            'min_size' => '',
            'max_width' => '',
            'max_height' => '',
            'max_size' => '',
            'mime_types' => 'jpg,jpeg,png,webp',
            'insert' => 'append',
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
            'ui' => 1,
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
    'menu_order' => 0,
    'position' => 'normal',
    'style' => 'default',
    'label_placement' => 'top',
    'instruction_placement' => 'label',
    'hide_on_screen' => '',
    'active' => true,
    'description' => 'System for managing slider images in Bannere CPT',
    'show_in_graphql' => 1,
    'graphql_field_name' => 'bannereGallerySystem',
    'map_graphql_types_from_location_rules' => 0,
    'graphql_types' => '',
);

// Înregistrează Field Group
acf_add_local_field_group($field_group);

echo "✅ Field Group 'Bannere Gallery System' definit local!\n";

// Salvează și în baza de date pentru persistență (ca să apară în UI)
// Căutăm dacă există deja un grup cu acest key pentru a nu crea duplicate
$existing_posts = get_posts(array(
    'post_type' => 'acf-field-group',
    'meta_key' => 'rule', // ACF stochează regulile serializate, dar titlul e mai sigur
    'title' => 'Bannere Gallery System',
    'posts_per_page' => 1
));

if ($existing_posts) {
    $post_id = $existing_posts[0]->ID;
    echo "⚠️ Grupul există deja (ID: $post_id). Actualizăm...\n";
    $post_arr = array(
        'ID'           => $post_id,
        'post_title'    => 'Bannere Gallery System',
        'post_content'  => serialize($field_group),
    );
    wp_update_post($post_arr);
} else {
    $post_id = wp_insert_post(array(
        'post_title'    => 'Bannere Gallery System',
        'post_content'  => serialize($field_group),
        'post_status'   => 'publish',
        'post_type'     => 'acf-field-group',
    ));
    echo "✅ Field Group salvat nou în DB cu ID: {$post_id}\n";
}

if (is_wp_error($post_id)) {
    echo "ERROR: " . $post_id->get_error_message() . "\n";
} else {
    // Update meta pentru GraphQL explicitly
    update_post_meta($post_id, 'show_in_graphql', 1);
    update_post_meta($post_id, 'graphql_field_name', 'bannereGallerySystem');
    
    echo "✅ GraphQL activat pentru Bannere Gallery System\n";
}

echo "\n=== Setup Complet ===\n";
echo "Acum poți merge la Bannere > Add New și vei vedea câmpul 'Hero Gallery'.\n";
