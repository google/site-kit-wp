<?php
/**
 * Class Google\Site_Kit\Core\User_Input\User_Input_Site_Settings
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for handling the site specific settings in User Input.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Input_Site_Settings extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_user_input_settings';

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
}
