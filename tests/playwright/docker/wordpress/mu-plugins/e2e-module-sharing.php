<?php
/**
 * Plugin Name: E2E Module Sharing
 * Description: Forces dashboard-sharing settings for E2E tests based on a cookie set by the Playwright fixture.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

const E2E_SHARED_MODULES_COOKIE    = '_wp_test_shared_modules';
const E2E_DASHBOARD_SHARING_OPTION = 'googlesitekit_dashboard_sharing';

/**
 * Gets the dashboard-sharing settings declared for the current test.
 *
 * @return array<string, mixed> Sharing settings keyed by module slug, or an empty array.
 */
function e2e_get_shared_modules() {
	if ( empty( $_COOKIE[ E2E_SHARED_MODULES_COOKIE ] ) ) {
		return array();
	}

	$decoded = json_decode(
		rawurldecode( wp_unslash( $_COOKIE[ E2E_SHARED_MODULES_COOKIE ] ) ),
		true
	);

	return is_array( $decoded ) ? $decoded : array();
}

$e2e_shared_modules = e2e_get_shared_modules();

if ( ! empty( $e2e_shared_modules ) ) {
	// Force the value on read (short-circuiting `get_option`) so the sharing
	// settings bypass the save-time sanitize, which drops a module unless it is
	// recognized as shareable at that instant.
	add_filter(
		'pre_option_' . E2E_DASHBOARD_SHARING_OPTION,
		function () use ( $e2e_shared_modules ) {
			return $e2e_shared_modules;
		}
	);
}
