<?php
/**
 * Script de import direct pentru WordPress
 */

// Load WordPress
define('WP_USE_THEMES', false);
require_once('/var/www/html/wp-load.php');

// Load WordPress Importer
require_once('/var/www/html/wp-content/plugins/wordpress-importer/wordpress-importer.php');

// Creează instanță importer
$importer = new WP_Import();

// Setări import
$importer->fetch_attachments = true; // Descarcă imagini

// Rulează import
$file = '/tmp/export.xml';

if (!file_exists($file)) {
    die("Error: File not found: $file\n");
}

echo "Starting import from: $file\n";
echo "Fetching attachments: " . ($importer->fetch_attachments ? 'YES' : 'NO') . "\n\n";

// Rulează import
$importer->import($file);

echo "\n\nImport completed!\n";
