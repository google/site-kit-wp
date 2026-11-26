<?php
/**
 * Class Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Is_Widget_Area_Hidden
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Key_Metrics;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for handling the Key Metrics setup widget area hidden state.
 *
 * This site-wide flag hides Key Metrics when Site Kit is first set up without
 * Analytics. It is set only during the site's first sign-in, and deleted once
 * Analytics is connected. It is not a user's preference to hide Key Metrics,
 * and should not be reused as one.
 *
 * @since 1.184.0
 * @access private
 * @ignore
 */
class Key_Metrics_Setup_Is_Widget_Area_Hidden extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_key_metrics_setup_is_widget_area_hidden';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.184.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}
}
