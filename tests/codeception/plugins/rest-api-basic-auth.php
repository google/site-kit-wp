<?php
/**
 * Plugin Name: E2E Tests REST-API Basic Authentication
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Adds basic authentication handler for REST API endpoints.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter( 'determine_current_user', 'googlesitekit_basic_auth_handler', 20 );
add_filter( 'rest_authentication_errors', 'googlesitekit_basic_auth_error' );

function googlesitekit_basic_auth_handler( $user ) {
	global $wp_json_basic_auth_error;

	$wp_json_basic_auth_error = null;

	// Don't authenticate twice
	if ( ! empty( $user ) ) {
		return $user;
	}

	// Check that we're trying to authenticate
	if ( ! isset( $_SERVER['PHP_AUTH_USER'] ) ) {
		return $user;
	}

	/**
	 * In multi-site, wp_authenticate_spam_check filter is run on authentication. This filter calls
	 * get_currentuserinfo which in turn calls the determine_current_user filter. This leads to infinite
	 * recursion and a stack overflow unless the current function is removed from the determine_current_user
	 * filter during authentication.
	 */
	remove_filter( 'determine_current_user', 'googlesitekit_basic_auth_handler', 20 );
	$user = wp_authenticate( $_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'] );
	add_filter( 'determine_current_user', 'googlesitekit_basic_auth_handler', 20 );

	if ( is_wp_error( $user ) ) {
		$wp_json_basic_auth_error = $user;
		return null;
	}

	$wp_json_basic_auth_error = true;

	return $user->ID;
}

function googlesitekit_basic_auth_error( $error ) {
	global $wp_json_basic_auth_error;

	return ! empty( $error )
		? $error
		: $wp_json_basic_auth_error;
}
