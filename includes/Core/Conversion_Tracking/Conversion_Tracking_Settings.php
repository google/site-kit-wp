<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for handling the Conversion Tracking settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Conversion_Tracking_Settings extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_conversion_tracking';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * The default value for the setting.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default values
	 */
	protected function get_default() {
		return array(
			'enabled' => false,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return bool TRUE if Conversion Tracking is enabled, otherwise FALSE.
	 */
	public function is_conversion_tracking_enabled() {
		return $this->get()['enabled'];
	}
}
