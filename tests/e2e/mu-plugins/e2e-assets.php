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
			array(),
			md5_file( plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . 'dist/assets/js/e2e-utilities.js' ),
			true
		);

		wp_add_inline_script(
			'googlesitekit-e2e-utilities',
			implode(
				"\n",
				array(
					sprintf( 'window._apiFetchRootURL = "%s";', esc_url_raw( get_rest_url() ) ),
					sprintf(
						'window._apiFetchNonceMiddleware = "%s";',
						( wp_installing() && ! is_multisite() ) ? '' : wp_create_nonce( 'wp_rest' )
					),
					sprintf( 'window._apiFetchNonceEndpoint = "%s";', admin_url( 'admin-ajax.php?action=rest-nonce' ) ),
				)
			),
			'before'
		);
	}
);
