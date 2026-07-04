<?php
/**
 * Plugin Name: E2E Assets
 * Description: Enqueues assets needed for E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Assets\Script;

add_filter(
	'googlesitekit_assets',
	function ( $assets ) {
		$assets[] = new Script(
			'googlesitekit-e2e-api-fetch',
			array(
				'src'          => plugins_url( 'dist/assets/js/e2e-api-fetch.js', GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
				'dependencies' => array( 'googlesitekit-apifetch-data', 'googlesitekit-i18n' ),
				'version'      => md5_file( plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . 'dist/assets/js/e2e-api-fetch.js' ),
			)
		);
		$assets[] = new Script(
			'googlesitekit-e2e-redux-logger',
			array(
				'src'          => plugins_url( 'dist/assets/js/e2e-redux-logger.js', GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
				'version'      => md5_file( plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . 'dist/assets/js/e2e-redux-logger.js' ),
				'dependencies' => array(),
				'in_footer'    => false, // Load as early as possible.
			)
		);

		return $assets;
	}
);
// Enqueue E2E Utilities globally.
// If asset is not registered enqueuing is a no-op.
$enqueue = function () {
	wp_enqueue_script( 'googlesitekit-e2e-api-fetch' );
	wp_enqueue_script( 'googlesitekit-e2e-redux-logger' );
};
// Site Kit registers its assets on priority 10 (admin bar on 40).
// These are hooked after to avoid enqueuing before registered.
add_action( 'wp_enqueue_scripts', $enqueue, 99 );
add_action( 'admin_enqueue_scripts', $enqueue, 99 );
unset( $enqueue );
