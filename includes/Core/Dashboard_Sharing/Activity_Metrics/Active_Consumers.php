<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Active_Consumers
 *
 * @package   Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing active consumers for an access token.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Active_Consumers extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_active_consumers';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.27.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.27.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}
}
