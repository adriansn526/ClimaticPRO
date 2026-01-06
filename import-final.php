<?php
/**
 * Import direct XML WordPress fără plugin-uri și hook-uri
 */

// Load WordPress
define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

// Dezactivează toate hook-urile care pot cauza probleme
remove_all_actions('save_post');
remove_all_actions('wp_insert_post');

echo "=== WordPress XML Import Direct (No Hooks) ===\n\n";

$xml_file = '/tmp/export.xml';

if (!file_exists($xml_file)) {
    die("ERROR: XML file not found: $xml_file\n");
}

echo "Loading XML file: $xml_file\n";
$xml = simplexml_load_file($xml_file);

if (!$xml) {
    die("ERROR: Failed to parse XML file\n");
}

$namespaces = $xml->getNamespaces(true);

$stats = [
    'pages' => 0,
    'posts' => 0,
    'attachments' => 0,
    'skipped' => 0,
];

echo "\nStarting import (hooks disabled)...\n\n";

foreach ($xml->channel->item as $item) {
    $wp_item = $item->children($namespaces['wp']);
    $content_item = $item->children($namespaces['content']);
    
    $post_type = (string)$wp_item->post_type;
    $post_status = (string)$wp_item->status;
    $post_title = (string)$item->title;
    
    if (!in_array($post_type, ['page', 'post', 'attachment'])) {
        $stats['skipped']++;
        continue;
    }
    
    echo "Importing {$post_type}: {$post_title}... ";
    
    // Verifică dacă există
    $existing = get_page_by_title($post_title, OBJECT, $post_type);
    if ($existing) {
        echo "SKIP (exists)\n";
        $stats['skipped']++;
        continue;
    }
    
    // Insert direct în DB fără hook-uri
    global $wpdb;
    
    $post_data = [
        'post_title'    => $post_title,
        'post_content'  => (string)$content_item->encoded,
        'post_excerpt'  => (string)$item->description,
        'post_status'   => $post_status === 'publish' ? 'publish' : 'draft',
        'post_type'     => $post_type,
        'post_date'     => (string)$wp_item->post_date,
        'post_date_gmt' => (string)$wp_item->post_date_gmt,
        'post_author'   => 1,
        'post_name'     => sanitize_title($post_title),
    ];
    
    $result = $wpdb->insert($wpdb->posts, $post_data);
    
    if ($result === false) {
        echo "ERROR\n";
        $stats['skipped']++;
        continue;
    }
    
    $post_id = $wpdb->insert_id;
    echo "OK (ID: {$post_id})\n";
    
    // Stats
    if ($post_type === 'page') {
        $stats['pages']++;
    } elseif ($post_type === 'post') {
        $stats['posts']++;
    } elseif ($post_type === 'attachment') {
        $stats['attachments']++;
    }
    
    // Meta data
    foreach ($wp_item->postmeta as $meta) {
        $meta_key = (string)$meta->meta_key;
        $meta_value = (string)$meta->meta_value;
        
        if ($meta_key && $meta_value) {
            $wpdb->insert($wpdb->postmeta, [
                'post_id' => $post_id,
                'meta_key' => $meta_key,
                'meta_value' => $meta_value,
            ]);
        }
    }
}

echo "\n=== Import Complete ===\n";
echo "Pages: {$stats['pages']}\n";
echo "Posts: {$stats['posts']}\n";
echo "Attachments: {$stats['attachments']}\n";
echo "Skipped: {$stats['skipped']}\n";
echo "\nTotal imported: " . ($stats['pages'] + $stats['posts'] + $stats['attachments']) . "\n";
