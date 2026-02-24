<?php
/**
 * Plugin Name: ACF Bannere Registration
 * Description: Registers ACF Field Group for Bannere CPT programmatically to ensure stability.
 */

add_action('acf/init', function() {
    
    if (!function_exists('acf_add_local_field_group')) {
        return;
    }

    // 5 Individual Image Fields (Alternative Method)
    $fields = array();

    // Generare automata 5 campuri
    for ($i = 1; $i <= 5; $i++) {
        $fields[] = array(
            'key' => 'field_hero_image_' . $i,
            'label' => 'Banner Image ' . $i,
            'name' => 'hero_image_' . $i,
            'type' => 'image',
            'instructions' => "Upload banner image #{$i} (1920x600px).",
            'required' => 0,
            'return_format' => 'array',
            'preview_size' => 'medium',
            'library' => 'all',
            'show_in_graphql' => 1,
            'graphql_field_name' => 'heroImage' . $i,
        );
    }

    // Checkbox Activ
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

    // Register Group
    acf_add_local_field_group(array(
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
        'menu_order' => 0,
        'position' => 'normal',
        'style' => 'default',
        'label_placement' => 'top',
        'instruction_placement' => 'label',
        'active' => true,
        'description' => '5 Individual Image fields for stability',
        'show_in_graphql' => 1,
        'graphql_field_name' => 'bannereSlots',
        'map_graphql_types_from_location_rules' => 0,
        'graphql_types' => array('Banner')
    ));
    
});
