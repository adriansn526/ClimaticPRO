<?php
/**
 * Plugin Name: Local SSL Verify Disable
 * Description: Disables SSL verification for local development with self-signed certs.
 */

add_filter('https_ssl_verify', '__return_false');

add_filter('http_request_args', function($args) {
    $args['sslverify'] = false;
    return $args;
}, 10, 1);
