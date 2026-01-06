<?php
/**
 * Plugin Name: Disable WordPress Updates
 * Description: Disable all WordPress update checks and notifications
 */

// Disable all update checks
add_filter('pre_site_transient_update_core', '__return_null');
add_filter('pre_site_transient_update_plugins', '__return_null');
add_filter('pre_site_transient_update_themes', '__return_null');

// Remove update actions
remove_action('admin_init', '_maybe_update_core');
remove_action('admin_init', '_maybe_update_plugins');
remove_action('admin_init', '_maybe_update_themes');

// Remove update nags
remove_action('admin_notices', 'update_nag', 3);
remove_action('network_admin_notices', 'update_nag', 3);

// Hide update menu
add_action('admin_menu', function() {
    remove_submenu_page('index.php', 'update-core.php');
}, 999);
