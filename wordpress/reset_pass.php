<?php
require_once 'wp-load.php';

$user = get_user_by('login', 'admin');
if (!$user) {
    echo "User 'admin' not found!\n";
    exit(1);
}

echo "Resetting password for user ID: " . $user->ID . "\n";
wp_set_password('climatic2026!', $user->ID);

if (function_exists('wp_cache_flush')) {
    echo "Flushing object cache...\n";
    wp_cache_flush();
}

echo "Password reset successfully.\n";
?>
