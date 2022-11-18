<?php
/**
 * Class Google\Site_Kit\Core\User_Input\User_Input_User_Settings
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use Closure;
use Google\Site_Kit\Core\Storage\User_Setting;
use Google\Site_Kit\Core\User_Input\User_Input_Settings;

/**
 * Class for handling the user specific settings in User Input.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Input_User_Settings extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_user_input_settings';

	/**
	 * The scope for which the settings are handled by this class.
	 */
	const SCOPE = 'user';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return Closure
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			return User_Input_Settings::sanitize_settings( $this, $settings, 'user' );
		};
	}
}
