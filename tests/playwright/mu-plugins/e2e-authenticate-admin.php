<?php
/**
 * Plugin Name: E2E Authenticate Admin
 * Description: Authenticates all requests as the specified user during E2E tests, based on a cookie set by the Playwright fixture.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! isset( $_COOKIE['_wp_test_user'] ) ) {
	return;
}

$e2e_test_username = sanitize_user( $_COOKIE['_wp_test_user'], true );

// Make the current request appear authenticated as the specified user.
add_filter(
	'determine_current_user',
	function ( $user_id ) use ( $e2e_test_username ) {
		if ( $user_id ) {
			return $user_id;
		}

		$user = get_user_by( 'login', $e2e_test_username );

		return $user ? $user->ID : $user_id;
	}
);

// Set a persistent auth cookie so wp-admin pages (which check for a real cookie
// via auth_redirect()) don't redirect to the login page.
add_action(
	'init',
	function () use ( $e2e_test_username ) {
		// Nothing to do if there is already a valid logged-in cookie.
		if ( wp_validate_auth_cookie( '', 'logged_in' ) ) {
			return;
		}

		$user = get_user_by( 'login', $e2e_test_username );
		if ( $user ) {
			wp_set_auth_cookie( $user->ID, true );
		}
	}
);
