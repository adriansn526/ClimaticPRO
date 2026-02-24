<?php
/*
Plugin Name: ClimaticPro GraphQL Customizations
Description: Forces registration of Bannere and Brands for GraphQL visibili// Custom Registration for Bannere and PaBrand GraphQL support
Version: 1.0
Author: Antigravity
*/

add_action( 'init', function() {
    // error_log('CUSTOM GRAPHQL INIT RUNNING');
    // Register Bannere CPT
    register_post_type( 'bannere', [
        'labels' => [ 'name' => 'Bannere', 'singular_name' => 'Banner' ],
        'public' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'Banner',
        'graphql_plural_name' => 'Bannere',
        'supports' => [ 'title', 'editor', 'thumbnail', 'custom-fields' ],
        'menu_icon' => 'dashicons-images-alt2',
    ]);

    // Force register pa_brand taxonomy for GraphQL
    // Note: WooCommerce usually registers this, but we force it here for GraphQL visibility
    register_taxonomy( 'pa_brand', [ 'product' ], [
        'labels' => [ 'name' => 'Brands', 'singular_name' => 'Brand' ],
        'public' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'PaBrand',
        'graphql_plural_name' => 'AllPaBrand',
        'hierarchical' => true,
        'show_ui' => true,
    ]);
}, 20 );

// Register Custom GraphQL Field for Brand Image
add_action( 'graphql_register_types', function() {
    register_graphql_field( 'PaBrand', 'brandImage', [
        'type' => 'String',
        'description' => 'Brand Logo URL from term meta',
        'resolve' => function( $term ) {
            $image_meta = get_term_meta( $term->term_id, 'image', true );
            // Check if it's an array with URL (standard ACF/WooAttr format)
            if ( is_array( $image_meta ) && isset( $image_meta['url'] ) ) {
                return $image_meta['url'];
            }
            // Fallback: sometimes it might be just the URL string
            if ( is_string( $image_meta ) && !empty( $image_meta ) ) {
                return $image_meta;
            }
            return null;
        }
    ]);
});

// Enable GraphQL Introspection for Debugging
add_filter( 'graphql_disable_introspection', '__return_false' );

add_action( 'graphql_register_types', function() {
    // error_log('CUSTOM GRAPHQL REGISTRATION FIRED');
    // Register BannerSettings Type
    register_graphql_object_type( 'BannerSettings', [
        'description' => 'ACF Settings for Banner',
        'fields' => [
            'locatie' => [ 'type' => ['list_of' => 'String'] ],
            'activ' => [ 'type' => 'Boolean' ],
            'titluBanner' => [ 'type' => 'String' ],
            'subtitluBanner' => [ 'type' => 'String' ],
            'ctaText' => [ 'type' => 'String' ],
            'ctaLink' => [ 'type' => 'String' ],
            'ctaStyle' => [ 'type' => 'String' ],
            'ordine' => [ 'type' => 'Integer' ],
            'targetBlank' => [ 'type' => 'Boolean' ],
            'imagineDesktop' => [ 'type' => 'MediaItem' ],
            'imagineMobile' => [ 'type' => 'MediaItem' ],
            'dataStart' => [ 'type' => 'String' ],
            'dataSfarsit' => [ 'type' => 'String' ],
        ]
    ]);

    // Register bannerSettings field on Banner
    register_graphql_field( 'Banner', 'bannerSettings', [
        'type' => 'BannerSettings',
        'resolve' => function( $post ) {
            if ( function_exists('get_field') ) {
                $data = get_field('banner_settings', $post->ID);
                if ( ! $data ) $data = get_field('settings', $post->ID);
                return $data;
            }
            return null;
        }
    ]);

    // MANUALLY REGISTER BANNERE SLOTS (Alternative Fix)
    register_graphql_object_type( 'BannereSlots', [
        'description' => 'Manual Slots for Banners',
        'fields' => [
            'heroImage1' => [ 'type' => 'MediaItem' ],
            'heroImage2' => [ 'type' => 'MediaItem' ],
            'heroImage3' => [ 'type' => 'MediaItem' ],
            'heroImage4' => [ 'type' => 'MediaItem' ],
            'heroImage5' => [ 'type' => 'MediaItem' ],
            'isActive' => [ 'type' => 'Boolean' ],
        ]
    ]);

    register_graphql_field( 'Banner', 'bannereSlots', [
        'type' => 'BannereSlots',
        'resolve' => function( $post ) {
            $resolve_image = function($field_name, $post_id) {
                $img = get_field($field_name, $post_id);
                $id = is_array($img) ? ($img['ID'] ?? null) : $img;
                
                if ( ! $id ) return null;

                $post_object = get_post($id);
                if ( ! $post_object ) return null;

                // Return Model
                if ( class_exists( '\WPGraphQL\Model\Post' ) ) {
                    return new \WPGraphQL\Model\Post( $post_object );
                }
                return null;
            };

            return [
                'heroImage1' => $resolve_image('hero_image_1', $post->ID),
                'heroImage2' => $resolve_image('hero_image_2', $post->ID),
                'heroImage3' => $resolve_image('hero_image_3', $post->ID),
                'heroImage4' => $resolve_image('hero_image_4', $post->ID),
                'heroImage5' => $resolve_image('hero_image_5', $post->ID),
                'isActive'   => get_field('is_active', $post->ID),
            ];
        }
    ]);
}, 100);
