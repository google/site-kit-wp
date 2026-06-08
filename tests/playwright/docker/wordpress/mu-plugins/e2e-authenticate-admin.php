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

// Set the E2E test user.
$e2e_test_user = array(
	'login' => 'admin',
);

if ( ! empty( $_COOKIE['_wp_test_user'] ) ) {
	$raw_user = rawurldecode( wp_unslash( $_COOKIE['_wp_test_user'] ) );
	$decoded  = json_decode( $raw_user, true );

	if ( is_array( $decoded ) && ! empty( $decoded['login'] ) ) {
		$e2e_test_user['login'] = sanitize_user( $decoded['login'], true );

		if ( isset( $decoded['email'] ) && is_string( $decoded['email'] ) ) {
			$e2e_test_user['email'] = $decoded['email'];
		}

		if ( isset( $decoded['firstName'] ) && is_string( $decoded['firstName'] ) ) {
			$e2e_test_user['firstName'] = sanitize_text_field( $decoded['firstName'] );
		}

		if ( isset( $decoded['lastName'] ) && is_string( $decoded['lastName'] ) ) {
			$e2e_test_user['lastName'] = sanitize_text_field( $decoded['lastName'] );
		}
	} else {
		$e2e_test_user['login'] = sanitize_user( $raw_user, true );
	}
}

$e2e_test_username = $e2e_test_user['login'];

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

add_action(
	'init',
	function () use ( $e2e_test_user ) {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user = wp_get_current_user();
		if ( ! $user || ! $user->ID ) {
			return;
		}

		if ( array_key_exists( 'firstName', $e2e_test_user ) ) {
			$user->user_firstname = (string) $e2e_test_user['firstName'];
		}

		if ( array_key_exists( 'lastName', $e2e_test_user ) ) {
			$user->user_lastname = (string) $e2e_test_user['lastName'];
		}

		if ( ! array_key_exists( 'email', $e2e_test_user ) ) {
			return;
		}

		if ( '' === $e2e_test_user['email'] ) {
			$user->user_email = '';
			if ( isset( $user->data ) && is_object( $user->data ) ) {
				$user->data->user_email = '';
			}
			return;
		}

		$sanitized_email  = sanitize_email( $e2e_test_user['email'] );
		$user->user_email = $sanitized_email;
		if ( isset( $user->data ) && is_object( $user->data ) ) {
			$user->data->user_email = $sanitized_email;
		}
	},
	1
);

// Set a persistent auth cookie so wp-admin pages (which check for a real cookie
// via auth_redirect()) don't redirect to the login page.
add_action(
	'init',
	function () use ( $e2e_test_username ) {
		// Only wp-admin pages call auth_redirect(); nothing to do elsewhere.
		if ( ! is_admin() ) {
			return;
		}

		// Nothing to do if there is already a valid logged-in cookie.
		if ( wp_validate_auth_cookie( '', 'logged_in' ) ) {
			return;
		}

		$user = get_user_by( 'login', $e2e_test_username );
		if ( $user ) {
			wp_set_auth_cookie( $user->ID, true );
			// Redirect to the same URL so the browser re-sends the request
			// with the newly-set cookie, allowing auth_redirect() to pass.
			wp_safe_redirect( home_url( $_SERVER['REQUEST_URI'] ) );
			exit;
		}
	}
);
