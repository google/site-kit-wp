<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Was_Analytics_4_Connected
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Was_Analytics_4_Connected class.
 *
 * Indicates whether Google Analytics 4 was ever connected to the site.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Was_Analytics_4_Connected extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_was_analytics-4_connected';

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
