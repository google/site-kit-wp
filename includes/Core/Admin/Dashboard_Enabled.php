<?php
/**
 * Class Google\Site_Kit\Core\Admin\Dashboard_Enabled
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class handling the WordPress dashboard widget settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Dashboard_Enabled extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_dashboard_widget_enabled';

	/**
	 * Gets the value of the setting.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Value set for the option, or registered default if not set.
	 */
	public function get() {
		return (bool) parent::get();
	}

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

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return boolean The default value.
	 */
	protected function get_default() {
		return true;
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable The callable sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return 'boolval';
	}
}
