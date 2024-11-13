<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader_Interface
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

/**
 * Defines methods that must be implemented by a profile reader class.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Profile_Reader_Interface {

	/**
	 * Gets the user profile data using the provided ID token.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id_token ID token.
	 * @return array|WP_Error User profile data or WP_Error on failure.
	 */
	public function get_profile_data( $id_token );
}
