<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\WP_Login_Accessible_Check
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks;

/**
 * Compatibility check for WordPress login accessibility.
 *
 * @since 1.164.0
 */
class WP_Login_Accessible_Check extends Compatibility_Check {

	/**
	 * Gets the unique slug for this compatibility check.
	 *
	 * @since 1.164.0
	 *
	 * @return string The unique slug for this compatibility check.
	 */
	public function get_slug() {
		return 'wp_login_inaccessible';
	}

	/**
	 * Runs the compatibility check.
	 *
	 * @since 1.164.0
	 *
	 * @return bool True if login is inaccessible (404), false otherwise.
	 */
	public function run() {
		// Hardcode the wp-login at the end to avoid issues with filters - plugins modifying the wp-login page
		// also override the URL request which skips the correct detection.
		$login_url = site_url() . '/wp-login.php';
		$response  = wp_remote_head( $login_url );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$status_code = wp_remote_retrieve_response_code( $response );

		return 404 === $status_code;
	}
}
