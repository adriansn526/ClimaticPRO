<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/wp-load.php';

$taxonomies = get_taxonomies(array('public'   => true, '_builtin' => false), 'objects');

echo "Registered Taxonomies:\n";
foreach ($taxonomies as $taxonomy) {
    echo "Label: " . $taxonomy->label . "\n";
    echo "Name (Slug): " . $taxonomy->name . "\n";
    echo "GraphQL Path: " . (isset($taxonomy->graphql_single_name) ? $taxonomy->graphql_single_name : 'N/A') . "\n";
    echo "--------------------------\n";
}
