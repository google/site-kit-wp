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
 * @since 1.168.0
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
	 * @since 1.168.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.168.0
	 *
	 * @return callable The sanitizing function.
	 */
	protected function get_sanitize_callback() {
		return 'boolval';
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.168.0
	 *
	 * @return bool Value set for the option, or registered default if not set.
	 */
	public function get() {
		return (bool) parent::get();
	}
}
