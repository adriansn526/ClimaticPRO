<?php
/**
 * Fix ACF Field Group - Înregistrare corectă în DB
 */

define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

echo "=== Fix ACF Field Group ===\n\n";

// Șterge field group vechi (ID 434)
wp_delete_post(434, true);
echo "✅ Field group vechi șters\n";

// Creează field group nou folosind funcțiile ACF
if (function_exists('acf_import_field_group')) {
    
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
                'return_format' => 'array',
                'library' => 'all',
                'min' => 1,
                'max' => 5,
                'mime_types' => 'jpg,jpeg,png,webp',
                'insert' => 'append',
                'preview_size' => 'medium',
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
        'active' => 1,
        'description' => 'Galerie imagini pentru banner slider pe pagina de climatizare',
    );
    
    // Import field group (creează în DB)
    acf_import_field_group($field_group);
    
    echo "✅ Field Group creat cu succes în DB\n";
    
    // Găsește ID-ul nou creat
    global $wpdb;
    $new_id = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'acf-field-group' AND post_title = 'Bannere Pagina Climatizare' ORDER BY ID DESC LIMIT 1");
    
    if ($new_id) {
        echo "✅ Field Group ID: {$new_id}\n";
        
        // Activează GraphQL pentru field group
        update_post_meta($new_id, 'show_in_graphql', 1);
        update_post_meta($new_id, 'graphql_field_name', 'bannerePaginaClimatizare');
        
        // Găsește field-ul și activează GraphQL
        $field_id = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'acf-field' AND post_excerpt = 'field_bannere_hero' ORDER BY ID DESC LIMIT 1");
        
        if ($field_id) {
            update_post_meta($field_id, 'show_in_graphql', 1);
            update_post_meta($field_id, 'graphql_field_name', 'bannereHero');
            echo "✅ GraphQL activat pentru field\n";
        }
        
        echo "\n=== Implementare Completă ===\n";
        echo "Acum poți edita pagina 395 și vei vedea secțiunea 'Bannere Pagina Climatizare'!\n";
        echo "URL: https://cms.climaticpro.ro/wp-admin/post.php?post=395&action=edit\n";
    }
    
} else {
    echo "ERROR: ACF import function not available\n";
}
