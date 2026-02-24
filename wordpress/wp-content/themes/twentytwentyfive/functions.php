<?php
/**
 * Twenty Twenty-Five functions and definitions.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package WordPress
 * @subpackage Twenty_Twenty_Five
 * @since Twenty Twenty-Five 1.0
 */

// Adds theme support for post formats.
if ( ! function_exists( 'twentytwentyfive_post_format_setup' ) ) :
/**
 * Adds theme support for post formats.
 *
 * @since Twenty Twenty-Five 1.0
 *
 * @return void
 */
function twentytwentyfive_post_format_setup() {
( 'aside', 'audio', 'chat', 'gallery', 'image', 'link', 'quote', 'status', 'video' ) );
}
endif;
add_action( 'after_setup_theme', 'twentytwentyfive_post_format_setup' );

// Enqueues editor-style.css in the editors.
if ( ! function_exists( 'twentytwentyfive_editor_style' ) ) :
/**
 * Enqueues editor-style.css in the editors.
 *
 * @since Twenty Twenty-Five 1.0
 *
 * @return void
 */
function twentytwentyfive_editor_style() {
le.css' );
}
endif;
add_action( 'after_setup_theme', 'twentytwentyfive_editor_style' );

// Enqueues style.css on the front.
if ( ! function_exists( 'twentytwentyfive_enqueue_styles' ) ) :
/**
 * Enqueues style.css on the front.
 *
 * @since Twenty Twenty-Five 1.0
 *
 * @return void
 */
function twentytwentyfive_enqueue_styles() {
queue_style(
tytwentyfive-style',
t_theme_file_uri( 'style.css' ),
' )
dif;
add_action( 'wp_enqueue_scripts', 'twentytwentyfive_enqueue_styles' );

// Registers custom block styles.
if ( ! function_exists( 'twentytwentyfive_block_styles' ) ) :
/**
 * Registers custom block styles.
 *
 * @since Twenty Twenty-Five 1.0
 *
 * @return void
 */
function twentytwentyfive_block_styles() {
ame'         => 'checkmark-list',
     => __( 'Checkmark', 'twentytwentyfive' ),
line_style' => '
le-type: "\2713";
{
g-inline-start: 1ch;
dif;
add_action( 'init', 'twentytwentyfive_block_styles' );

// Registers pattern categories.
if ( ! function_exists( 'twentytwentyfive_pattern_categories' ) ) :
/**
 * Registers pattern categories.
 *
 * @since Twenty Twenty-Five 1.0
 *
 * @return void
 */
function twentytwentyfive_pattern_categories() {

_category(
tytwentyfive_page',
     => __( 'Pages', 'twentytwentyfive' ),
' => __( 'A collection of full page layouts.', 'twentytwentyfive' ),
_category(
tytwentyfive_post-format',
     => __( 'Post formats', 'twentytwentyfive' ),
' => __( 'A collection of post format patterns.', 'twentytwentyfive' ),
dif;
add_action( 'init', 'twentytwentyfive_pattern_categories' );

// Registers block binding sources.
if ( ! function_exists( 'twentytwentyfive_register_block_bindings' ) ) :
/**
 * Registers the post format block binding source.
 *
 * @since Twenty Twenty-Five 1.0
 *
 * @return void
 */
function twentytwentyfive_register_block_bindings() {
dings_source(
tytwentyfive/format',
            => _x( 'Post format name', 'Label for the block binding placeholder in the editor', 'twentytwentyfive' ),
tytwentyfive_format_binding',
dif;
add_action( 'init', 'twentytwentyfive_register_block_bindings' );

// Registers block binding callback function for the post format name.
if ( ! function_exists( 'twentytwentyfive_format_binding' ) ) :
/**
 * Callback function for the post format name block binding source.
 *
 * @since Twenty Twenty-Five 1.0
 *
 * @return string|void Post format name, or nothing if the format is 'standard'.
 */
function twentytwentyfive_format_binding() {
(  && 'standard' !==  ) {
 get_post_format_string(  );
dif;
