<?php
/**
 * Class Google\Site_Kit\Core\Admin_Bar\Admin_Bar_Enabled
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin_Bar;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class handling the admin bar menu settings.
 *
 * @since 1.39.0
 * @access private
 * @ignore
 */
class Admin_Bar_Enabled extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_admin_bar_menu_enabled';

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.39.0
	 *
	 * @return bool Value set for the option, or registered default if not set.
	 */
	public function get() {
		return (bool) parent::get();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.39.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.39.0
	 *
	 * @return boolean The default value.
	 */
	protected function get_default() {
		return true;
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.39.0
	 *
	 * @return callable The callable sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return 'boolval';
	}

}
