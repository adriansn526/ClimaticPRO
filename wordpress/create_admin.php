<?php
require_once 'wp-load.php';

$username = 'dev_admin';
$password = 'climatic2026!';
$email = 'dev_admin@example.com';

if (username_exists($username)) {
    echo "User $username already exists. Resetting password...\n";
    $user = get_user_by('login', $username);
    wp_set_password($password, $user->ID);
} else {
    echo "Creating user $username...\n";
    $user_id = wp_create_user($username, $password, $email);
    if (is_wp_error($user_id)) {
        echo "Error creating user: " . $user_id->get_error_message() . "\n";
        exit(1);
    }
    $user = get_user_by('id', $user_id);
    $user->set_role('administrator');
}

echo "User $username ready with password $password\n";
?>
