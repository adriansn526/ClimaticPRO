<?php
/**
 * Import direct XML WordPress fără plugin-uri
 * Rulează din linia de comandă
 */

// Load WordPress
define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

echo "=== WordPress XML Import Direct ===\n\n";

$xml_file = '/tmp/export.xml';

if (!file_exists($xml_file)) {
    die("ERROR: XML file not found: $xml_file\n");
}

echo "Loading XML file: $xml_file\n";
$xml = simplexml_load_file($xml_file);

if (!$xml) {
    die("ERROR: Failed to parse XML file\n");
}

// Namespace-uri WordPress
$namespaces = $xml->getNamespaces(true);
$wp = $xml->channel->children($namespaces['wp']);
$content = $xml->channel->children($namespaces['content']);

$stats = [
    'pages' => 0,
    'posts' => 0,
    'attachments' => 0,
    'skipped' => 0,
];

echo "\nStarting import...\n\n";

// Procesează fiecare item
foreach ($xml->channel->item as $item) {
    $wp_item = $item->children($namespaces['wp']);
    $content_item = $item->children($namespaces['content']);
    
    $post_type = (string)$wp_item->post_type;
    $post_status = (string)$wp_item->status;
    $post_title = (string)$item->title;
    
    // Skip dacă nu este page, post sau attachment
    if (!in_array($post_type, ['page', 'post', 'attachment'])) {
        $stats['skipped']++;
        continue;
    }
    
    echo "Importing {$post_type}: {$post_title}... ";
    
    // Verifică dacă există deja
    $existing = get_page_by_title($post_title, OBJECT, $post_type);
    if ($existing) {
        echo "SKIP (already exists)\n";
        $stats['skipped']++;
        continue;
    }
    
    // Pregătește datele pentru insert
    $post_data = [
        'post_title'    => $post_title,
        'post_content'  => (string)$content_item->encoded,
        'post_excerpt'  => (string)$item->description,
        'post_status'   => $post_status === 'publish' ? 'publish' : 'draft',
        'post_type'     => $post_type,
        'post_date'     => (string)$wp_item->post_date,
        'post_author'   => 1, // Admin user
    ];
    
    // Insert post
    $post_id = wp_insert_post($post_data, true);
    
    if (is_wp_error($post_id)) {
        echo "ERROR: " . $post_id->get_error_message() . "\n";
        $stats['skipped']++;
        continue;
    }
    
    echo "OK (ID: {$post_id})\n";
    
    // Update stats
    if ($post_type === 'page') {
        $stats['pages']++;
    } elseif ($post_type === 'post') {
        $stats['posts']++;
    } elseif ($post_type === 'attachment') {
        $stats['attachments']++;
    }
    
    // Adaugă meta data
    foreach ($wp_item->postmeta as $meta) {
        $meta_key = (string)$meta->meta_key;
        $meta_value = (string)$meta->meta_value;
        
        if ($meta_key && $meta_value) {
            update_post_meta($post_id, $meta_key, $meta_value);
        }
    }
}

echo "\n=== Import Complete ===\n";
echo "Pages imported: {$stats['pages']}\n";
echo "Posts imported: {$stats['posts']}\n";
echo "Attachments imported: {$stats['attachments']}\n";
echo "Skipped: {$stats['skipped']}\n";
echo "\nTotal: " . ($stats['pages'] + $stats['posts'] + $stats['attachments']) . " items\n";
