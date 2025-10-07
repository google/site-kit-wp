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
 * @since n.e.x.t
 */
class WP_Login_Accessible_Check extends Compatibility_Check {

	/**
	 * Gets the unique slug for this compatibility check.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The unique slug for this compatibility check.
	 */
	public function get_slug() {
		return 'wp_login_inaccessible';
	}

	/**
	 * Runs the compatibility check.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if login is inaccessible (404), false otherwise.
	 */
	public function run() {
		$login_url = wp_login_url();
		$response  = wp_remote_head( $login_url );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$status_code = wp_remote_retrieve_response_code( $response );

		return 404 === $status_code;
	}
}
