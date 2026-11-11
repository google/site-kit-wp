<?php
/**
 * Class Google\Site_Kit\Core\Admin\Dashboard_Widget_Enabled
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
 * @since 1.192.0
 * @access private
 * @ignore
 */
class Dashboard_Widget_Enabled extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_wp_dashboard_widget_enabled';

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.192.0
	 *
	 * @return bool Value set for the option, or registered default if not set.
	 */
	public function get() {
		return (bool) parent::get();
	}

	/**
	 * Checks whether the WordPress dashboard widget should be displayed, based on the setting and filter.
	 *
	 * @since 1.192.0
	 *
	 * @return bool True if the WordPress dashboard widget should be displayed, false otherwise.
	 */
	public function should_display() {
		if ( ! $this->get() ) {
			return false;
		}

		/**
		 * Filters whether the Site Kit WordPress dashboard widget should be displayed.
		 *
		 * This only runs when the WordPress dashboard widget setting is enabled, so it can only be used to hide the widget.
		 *
		 * @since 1.192.0
		 *
		 * @param bool $display Whether to display the WordPress dashboard widget.
		 */
		return (bool) apply_filters( 'googlesitekit_show_wp_dashboard_widget', true );
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.192.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.192.0
	 *
	 * @return boolean The default value.
	 */
	protected function get_default() {
		return true;
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.192.0
	 *
	 * @return callable The callable sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return 'boolval';
	}
}
