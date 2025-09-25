<?php
/**
 * WordPress.com compatibility check.
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks;

/**
 * Compatibility check for WordPress.com hosting.
 *
 * @since n.e.x.t
 */
class WP_COM_Check extends Compatibility_Check {

	/**
	 * Gets the unique slug for this compatibility check.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The unique slug for this compatibility check.
	 */
	public function get_slug() {
		return 'host_wordpress_dot_com';
	}

	/**
	 * Runs the compatibility check.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if hosted on WordPress.com, false otherwise.
	 */
	public function run() {
		return defined( 'IS_WPCOM' );
	}
}
