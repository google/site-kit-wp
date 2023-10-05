<?php
/**
 * Class Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Key_Metrics;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for handling the setup completion state of Key Metrics.
 *
 * @since 1.108.0
 * @access private
 * @ignore
 */
class Key_Metrics_Setup_Completed extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_key_metrics_setup_completed';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.108.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}
}
