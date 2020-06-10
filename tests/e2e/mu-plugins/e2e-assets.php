<?php
/**
 * Plugin Name: E2E Assets
 * Description: Enqueues assets needed for E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Assets\Script;

add_filter(
	'googlesitekit_assets',
	function ( $assets ) {
		$assets[] = new Script(
			'googlesitekit-e2e-utilities',
			array(
				'src'          => plugins_url( 'dist/assets/js/e2e-utilities.js', GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
				'dependencies' => array( 'googlesitekit-apifetch-data' ),
				'version'      => md5_file( plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . 'dist/assets/js/e2e-utilities.js' ),
			)
		);

		return $assets;
	}
);
// Enqueue E2E Utilities globally `wp_print_scripts` is called on admin and front.
// If asset is not registered enqueuing is a no-op.
add_action(
	'wp_print_scripts',
	function () {
		wp_enqueue_script( 'googlesitekit-e2e-utilities' );
	}
);
