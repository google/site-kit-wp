<?php
/**
 * Class Google\Site_Kit\Core\Authentication\User_Input_State
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class representing user_input_state for the user.
 *
 * @since 1.20.0
 * @access private
 * @ignore
 */
final class User_Input_State extends User_Setting {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekit_user_input_state';

	/**
	 * Value required key.
	 */
	const VALUE_REQUIRED = 'required';

	/**
	 * Value completed key.
	 */
	const VALUE_COMPLETED = 'completed';

	/**
	 * Value missing key.
	 */
	const VALUE_MISSING = 'missing';

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.23.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function( $value ) {
			if ( ! in_array( $value, array( self::VALUE_COMPLETED, self::VALUE_MISSING, self::VALUE_REQUIRED, '' ), true ) ) {
				return false;
			}

			return $value;
		};
	}
}
