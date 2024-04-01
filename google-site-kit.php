<?php
/**
 * Plugin main file.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @wordpress-plugin
 * Plugin Name:       Site Kit by Google
 * Plugin URI:        https://sitekit.withgoogle.com
 * Description:       Site Kit is a one-stop solution for WordPress users to use everything Google has to offer to make them successful on the web.
 * Version:           1.123.1
 * Requires at least: 5.2
 * Requires PHP:      5.6
 * Author:            Google
 * Author URI:        https://opensource.google.com
 * License:           Apache License 2.0
 * License URI:       https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain:       google-site-kit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Define most essential constants.
define( 'GOOGLESITEKIT_VERSION', '1.123.1' );
define( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE', __FILE__ );
define( 'GOOGLESITEKIT_PHP_MINIMUM', '5.6.0' );
define( 'GOOGLESITEKIT_WP_MINIMUM', '5.2.0' );

/**
 * Handles plugin activation.
 *
 * Throws an error if the plugin is activated with an insufficient version of PHP.
 *
 * @since 1.0.0
 * @since 1.3.0 Minimum required version of PHP raised to 5.6
 * @access private
 *
 * @param bool $network_wide Whether to activate network-wide.
 */
function googlesitekit_activate_plugin( $network_wide ) {
	if ( version_compare( PHP_VERSION, GOOGLESITEKIT_PHP_MINIMUM, '<' ) ) {
		wp_die(
			/* translators: %s: version number */
			esc_html( sprintf( __( 'Site Kit requires PHP version %s or higher', 'google-site-kit' ), GOOGLESITEKIT_PHP_MINIMUM ) ),
			esc_html__( 'Error Activating', 'google-site-kit' )
		);
	}

	if ( version_compare( get_bloginfo( 'version' ), GOOGLESITEKIT_WP_MINIMUM, '<' ) ) {
		wp_die(
			/* translators: %s: version number */
			esc_html( sprintf( __( 'Site Kit requires WordPress version %s or higher', 'google-site-kit' ), GOOGLESITEKIT_WP_MINIMUM ) ),
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
 * @since 1.0.0
 * @access private
 *
 * @param bool $network_wide Whether to deactivate network-wide.
 */
function googlesitekit_deactivate_plugin( $network_wide ) {
	if ( version_compare( PHP_VERSION, GOOGLESITEKIT_PHP_MINIMUM, '<' ) ) {
		return;
	}

	if ( $network_wide ) {
		return;
	}

	do_action( 'googlesitekit_deactivation', $network_wide );
}
register_deactivation_hook( __FILE__, 'googlesitekit_deactivate_plugin' );

/**
 * Resets opcache if possible.
 *
 * @since 1.3.0
 * @access private
 */
function googlesitekit_opcache_reset() {
	if ( version_compare( PHP_VERSION, GOOGLESITEKIT_PHP_MINIMUM, '<' ) ) {
		return;
	}

	if ( ! function_exists( 'opcache_reset' ) ) {
		return;
	}

	if ( ! empty( ini_get( 'opcache.restrict_api' ) ) && strpos( __FILE__, ini_get( 'opcache.restrict_api' ) ) !== 0 ) {
		return;
	}

	// `opcache_reset` is prohibited on the WordPress VIP platform due to memory corruption.
	if ( defined( 'WPCOM_IS_VIP_ENV' ) && WPCOM_IS_VIP_ENV ) {
		return;
	}

	opcache_reset(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.opcache_opcache_reset
}
add_action( 'upgrader_process_complete', 'googlesitekit_opcache_reset' );

if (
	version_compare( PHP_VERSION, GOOGLESITEKIT_PHP_MINIMUM, '>=' ) &&
	version_compare( get_bloginfo( 'version' ), GOOGLESITEKIT_WP_MINIMUM, '>=' )
) {
	require_once plugin_dir_path( __FILE__ ) . 'includes/loader.php';
}
