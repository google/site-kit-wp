<?php
/**
 * Plugin Name: E2E Feature Flags
 * Description: Enables feature flags during E2E tests based on a cookie set by the Playwright fixture.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

$e2e_feature_flags = array();
if ( ! empty( $_COOKIE['_wp_test_feature_flags'] ) ) {
	$raw               = sanitize_text_field( wp_unslash( $_COOKIE['_wp_test_feature_flags'] ) );
	$e2e_feature_flags = array_filter( array_map( 'trim', explode( ',', $raw ) ) );
}

if ( ! empty( $e2e_feature_flags ) ) {
	add_filter(
		'googlesitekit_is_feature_enabled',
		function ( $enabled, $feature ) use ( $e2e_feature_flags ) {
			if ( in_array( $feature, $e2e_feature_flags, true ) ) {
				return true;
			}
			return $enabled;
		},
		999,
		2
	);
}
