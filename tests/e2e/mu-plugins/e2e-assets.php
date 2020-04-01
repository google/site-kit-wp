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

add_action(
	'init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		wp_enqueue_script(
			'googlesitekit-e2e-utilities',
			plugins_url( 'dist/assets/js/e2e-utilities.js', GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			array( 'googlesitekit-apifetch-data' ),
			md5_file( plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . 'dist/assets/js/e2e-utilities.js' ),
			true
		);
	}
);
