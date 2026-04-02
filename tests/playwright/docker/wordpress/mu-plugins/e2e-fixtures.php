<?php
/**
 * Plugin Name: E2E Fixtures
 * Description: Provides test fixtures for E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Disable SSL verification for E2E tests. This is needed to make sure that we
// can make requests to the fixtures container.
add_filter( 'https_ssl_verify', '__return_false' );

// Forward the test fixture cookie as a header on all outbound Google API requests.
add_filter(
	'googlesitekit_e2e_oauth_params',
	function ( $params ) {
		if ( ! empty( $_COOKIE['_wp_test_fixtures'] ) ) {
			$params['fixtures'] = $_COOKIE['_wp_test_fixtures'];
		}

		return $params;
	}
);
