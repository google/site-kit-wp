<?php
/**
 * Plugin Name: E2E Tests Enhanced Conversions Plugin
 * Description: Test utilities for Enhanced Conversions E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

const E2E_EC_CONNECTED_MODULES_COOKIE = '_wp_test_connected_modules';
const E2E_EC_GTAG_MODULES             = array(
	'ads',
	'analytics-4',
	'tagmanager',
);

/**
 * Gets the connected modules declared for the current test.
 *
 * @return string[] Connected module slugs.
 */
function e2e_ec_get_connected_modules() {
	if ( empty( $_COOKIE[ E2E_EC_CONNECTED_MODULES_COOKIE ] ) ) {
		return array();
	}

	$raw_modules = sanitize_text_field( wp_unslash( $_COOKIE[ E2E_EC_CONNECTED_MODULES_COOKIE ] ) );

	if ( '' === $raw_modules ) {
		return array();
	}

	return array_values(
		array_filter(
			array_map( 'sanitize_key', explode( ',', $raw_modules ) )
		)
	);
}

add_filter(
	'googlesitekit_is_module_connected',
	function ( $connected, $module ) {
		if ( ! in_array( $module, E2E_EC_GTAG_MODULES, true ) ) {
			return $connected;
		}

		$connected_modules = e2e_ec_get_connected_modules();

		return in_array( $module, $connected_modules, true );
	},
	999,
	2
);

add_action(
	'googlesitekit_setup_gtag',
	function ( $gtag ) {
		$gtag->add_tag( 'G-TEST1234' );
	},
	1
);
