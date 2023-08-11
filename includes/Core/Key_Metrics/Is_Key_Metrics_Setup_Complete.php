<?php
/**
 * Class Google\Site_Kit\Core\Key_Metrics\Is_Key_Metrics_Setup_Complete
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Key_Metrics;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for handling the site specific answers in User Input.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Is_Key_Metrics_Setup_Complete extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_is_key_metrics_setup_complete';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}
}
