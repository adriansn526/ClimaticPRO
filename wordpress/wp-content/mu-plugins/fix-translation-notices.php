<?php
/**
 * Plugin Name: Fix Translation Loading Notices
 * Description: Suppresses PHP notices about early translation loading
 * Version: 1.0
 */

// Suppress translation loading notices
add_filter('doing_it_wrong_trigger_error', function($trigger, $function) {
    if ($function === '_load_textdomain_just_in_time') {
        return false;
    }
    return $trigger;
}, 10, 2);

// Ensure WooCommerce stays active
add_action('admin_init', function() {
    $active_plugins = get_option('active_plugins', array());
    if (!in_array('woocommerce/woocommerce.php', $active_plugins)) {
        $active_plugins[] = 'woocommerce/woocommerce.php';
        update_option('active_plugins', $active_plugins);
    }
}, 1);

// Disable WordPress upgrade nag and redirects
add_filter('pre_site_transient_update_core', '__return_null');
add_filter('pre_site_transient_update_plugins', '__return_null');
add_filter('pre_site_transient_update_themes', '__return_null');
remove_action('admin_init', '_maybe_update_core');
remove_action('admin_init', '_maybe_update_plugins');
remove_action('admin_init', '_maybe_update_themes');
