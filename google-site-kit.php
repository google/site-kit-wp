<?php
/**
 * Plugin main file.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @wordpress-plugin
 * Plugin Name: Site Kit by Google
 * Plugin URI:  https://sitekit.withgoogle.com
 * Description: Site Kit is a one-stop solution for WordPress users to use everything Google has to offer to make them successful on the web.
 * Version:     1.1.4
 * Author:      Google
 * Author URI:  https://opensource.google.com
 * License:     Apache License 2.0
 * License URI: https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain: google-site-kit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Define most essential constants.
define( 'GOOGLESITEKIT_VERSION', '1.1.4' );
define( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE', __FILE__ );

/**
 * Handles plugin activation.
 *
 * Throws an error if the plugin is activated on an older version than PHP 5.4.
 *
 * @access private
 *
 * @param bool $network_wide Whether to activate network-wide.
 */
function googlesitekit_activate_plugin( $network_wide ) {
	if ( version_compare( PHP_VERSION, '5.4.0', '<' ) ) {
		wp_die(
			esc_html__( 'Site Kit requires PHP version 5.4.', 'google-site-kit' ),
			esc_html__( 'Error Activating', 'google-site-kit' )
		);
	}

	if ( $network_wide ) {
		return;
	}

	do_action( 'googlesitekit_activation', $network_wide );
}

register_activation_hook( __FILE__, 'googlesitekit_activate_plugin' );

/**
 * Handles plugin deactivation.
 *
 * @access private
 *
 * @param bool $network_wide Whether to deactivate network-wide.
 */
function googlesitekit_deactivate_plugin( $network_wide ) {
	if ( version_compare( PHP_VERSION, '5.4.0', '<' ) ) {
		return;
	}

	if ( $network_wide ) {
		return;
	}

	do_action( 'googlesitekit_deactivation', $network_wide );
}

register_deactivation_hook( __FILE__, 'googlesitekit_deactivate_plugin' );

if ( version_compare( PHP_VERSION, '5.4.0', '>=' ) ) {
	require_once plugin_dir_path( __FILE__ ) . 'includes/loader.php';
}
