<?php
/**
 * Creare ACF Field Group pentru Bannere Pagina 395
 */

define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

echo "=== Creare ACF Field Group pentru Bannere ===\n\n";

// Verifică dacă ACF este activ
if (!function_exists('acf_add_local_field_group')) {
    die("ERROR: ACF Pro nu este activ!\n");
}

// Definește Field Group
$field_group = array(
    'key' => 'group_bannere_pagina_395',
    'title' => 'Bannere Pagina Climatizare',
    'fields' => array(
        array(
            'key' => 'field_bannere_hero',
            'label' => 'Bannere Hero',
            'name' => 'bannere_hero',
            'type' => 'gallery',
            'instructions' => 'Adaugă 3-5 imagini pentru banner slider (1920x600px recomandat)',
            'required' => 0,
            'conditional_logic' => 0,
            'return_format' => 'array',
            'library' => 'all',
            'min' => 1,
            'max' => 5,
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
            'graphql_field_name' => 'bannereHero',
        ),
    ),
    'location' => array(
        array(
            array(
                'param' => 'page',
                'operator' => '==',
                'value' => '395',
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
    'description' => 'Galerie imagini pentru banner slider pe pagina de climatizare',
    'show_in_graphql' => 1,
    'graphql_field_name' => 'bannerePaginaClimatizare',
    'map_graphql_types_from_location_rules' => 0,
    'graphql_types' => '',
);

// Înregistrează Field Group
acf_add_local_field_group($field_group);

echo "✅ Field Group 'Bannere Pagina Climatizare' creat cu succes!\n\n";

// Salvează în baza de date
$post_id = wp_insert_post(array(
    'post_title'    => 'Bannere Pagina Climatizare',
    'post_content'  => serialize($field_group),
    'post_status'   => 'publish',
    'post_type'     => 'acf-field-group',
));

if (is_wp_error($post_id)) {
    echo "ERROR: " . $post_id->get_error_message() . "\n";
} else {
    echo "✅ Field Group salvat în DB cu ID: {$post_id}\n";
    
    // Update meta pentru GraphQL
    update_post_meta($post_id, 'show_in_graphql', 1);
    update_post_meta($post_id, 'graphql_field_name', 'bannerePaginaClimatizare');
    
    echo "✅ GraphQL activat pentru Field Group\n";
}

echo "\n=== Implementare Completă ===\n";
echo "Field Group: Bannere Pagina Climatizare\n";
echo "Location: Page ID 395\n";
echo "Field: bannere_hero (Gallery)\n";
echo "GraphQL: bannerePaginaClimatizare.bannereHero\n";
echo "\nAcum poți edita pagina 395 și adăuga imagini în galerie!\n";
