<?php
/**
 * Class Google\Site_Kit\Core\User\Initial_Setup_Settings
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for handling initial setup settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Initial_Setup_Settings extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_initial_setup';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isAnalyticsSetupComplete' => null,
		);
	}
}
