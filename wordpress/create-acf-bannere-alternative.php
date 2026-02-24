<?php
/**
 * Fix ACF - Alternative Method
 * Inlocuieste Galeria cu 5 campuri individuale de tip Image.
 * Aceasta metoda este compatibila 100% cu orice versiune ACF si evita erorile de JS ale Galeriei.
 */

define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

echo "=== FIX ALTERNATIV: 5 Campuri Imagine Individuale ===\n\n";

if (!function_exists('acf_add_local_field_group')) {
    die("ERROR: ACF nu este activ!\n");
}

// 1. Sterge grupurile vechi (Gallery System)
$old_groups = ['Bannere Gallery System', 'Bannere Hero Fields'];
foreach ($old_groups as $title) {
    $existing = get_posts(array(
        'post_type' => 'acf-field-group',
        'title' => $title,
        'posts_per_page' => -1 
    ));
    if ($existing) {
        foreach ($existing as $p) {
            echo "🗑️ Sterg grup vechi: {$p->post_title} (ID: {$p->ID})\n";
            wp_delete_post($p->ID, true);
        }
    }
}

// 2. Defineste campurile individuale
$fields = array();

// Generare automata 5 campuri
for ($i = 1; $i <= 5; $i++) {
    $fields[] = array(
        'key' => 'field_hero_image_' . $i,
        'label' => 'Banner Image ' . $i,
        'name' => 'hero_image_' . $i,
        'type' => 'image', // Simplu IMAGE, nu Gallery
        'instructions' => "Upload banner image #{$i} (1920x600px).",
        'required' => 0,
        'return_format' => 'array',
        'preview_size' => 'medium',
        'library' => 'all',
        'show_in_graphql' => 1,
        'graphql_field_name' => 'heroImage' . $i,
    );
}

// Adaugam si checkbox-ul de Activ
$fields[] = array(
    'key' => 'field_banner_active',
    'label' => 'Set Active',
    'name' => 'is_active',
    'type' => 'true_false',
    'instructions' => 'Check to make this the active banner set.',
    'default_value' => 0,
    'show_in_graphql' => 1,
    'graphql_field_name' => 'isActive',
);

$field_group = array(
    'key' => 'group_bannere_slots',
    'title' => 'Bannere Hero Slots (Alternative)',
    'fields' => $fields,
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
    'graphql_field_name' => 'bannereSlots',
);

// 3. Salveaza
acf_add_local_field_group($field_group);

$post_id = wp_insert_post(array(
    'post_title'    => 'Bannere Hero Slots (Alternative)',
    'post_content'  => serialize($field_group),
    'post_status'   => 'publish',
    'post_type'     => 'acf-field-group',
));

if (is_wp_error($post_id)) {
    echo "ERROR: " . $post_id->get_error_message() . "\n";
} else {
    echo "✅ Field Group 'Bannere Hero Slots' creat cu ID: {$post_id}\n";
    echo "   - Contine 5 sloturi individuale de imagini.\n";
    update_post_meta($post_id, 'show_in_graphql', 1);
    update_post_meta($post_id, 'graphql_field_name', 'bannereSlots');
}

echo "\n=== IMPLEMENTARE COMPLETA ===\n";
echo "Mergi la Bannere > Add New. Vei vedea 'Banner Image 1', 'Banner Image 2', etc.\n";
