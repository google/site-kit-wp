<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class to store conversion tracking settings.
 *
 * @since 1.127.0
 * @access private
 * @ignore
 */
class Conversion_Tracking_Settings extends Setting {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_conversion_tracking';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.127.0
	 *
	 * @return string The expected type of the setting option.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.127.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'enabled' => false,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.127.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['enabled'] ) ) {
				$new_value['enabled'] = (bool) $value['enabled'];
			}

			return $new_value;
		};
	}


	/**
	 * Accessor for the `enabled` setting.
	 *
	 * @since 1.127.0
	 *
	 * @return bool TRUE if conversion tracking is enabled, otherwise FALSE.
	 */
	public function is_conversion_tracking_enabled() {
		return $this->get()['enabled'];
	}

}
