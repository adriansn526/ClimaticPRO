<?php
require_once('wp-load.php');

$args = array(
    'post_type'      => 'product',
    'posts_per_page' => -1,
    'post_status'    => 'publish',
);
$products = get_posts($args);
$result = array();
foreach ($products as $post) {
    if (function_exists('wc_get_product')) {
        $product = wc_get_product($post->ID);
        if ($product) {
             $result[] = array(
                 'id' => $post->ID,
                 'name' => $post->post_title,
                 'sku' => $product->get_sku(),
                 'price' => $product->get_price(),
             );
        }
    }
}
echo json_encode($result);
