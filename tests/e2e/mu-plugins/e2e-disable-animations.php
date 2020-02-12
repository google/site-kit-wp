<?php
/**
 * Plugin Name: Disable CSS animations
 * Description: Plugin for disabling CSS animations during E2E tests.
 */

function enqueue_disable_animations_stylesheet() {
	$custom_css = '* { animation-duration: 0ms !important; }';
	wp_add_inline_style( 'dashicons', $custom_css );
}
add_action( 'admin_enqueue_scripts', 'enqueue_disable_animations_stylesheet' );
add_action( 'login_enqueue_scripts', 'enqueue_disable_animations_stylesheet' );
add_action( 'wp_enqueue_scripts', 'enqueue_disable_animations_stylesheet' );
