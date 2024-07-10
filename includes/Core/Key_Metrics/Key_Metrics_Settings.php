<?php
/**
 * Class Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Settings
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Key_Metrics;

use Google\Site_Kit\Core\Storage\User_Setting;
use Google\Site_Kit\Core\Util\Sanitize;

/**
 * Class to store user key metrics settings.
 *
 * @since 1.93.0
 * @access private
 * @ignore
 */
class Key_Metrics_Settings extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_key_metrics_settings';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.93.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.93.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'widgetSlugs'    => array(),
			'isWidgetHidden' => false,
		);
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.93.0
	 *
	 * @param array $partial Partial settings array to save.
	 * @return bool True on success, false on failure.
	 */
	public function merge( array $partial ) {
		$settings = $this->get();
		$partial  = array_filter(
			$partial,
			function ( $value ) {
				return null !== $value;
			}
		);

		$allowed_settings = array(
			'widgetSlugs'    => true,
			'isWidgetHidden' => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.93.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			$sanitized_settings = array();

			if ( isset( $settings['widgetSlugs'] ) ) {
				$sanitized_settings['widgetSlugs'] = Sanitize::sanitize_string_list( $settings['widgetSlugs'] );
			}

			if ( isset( $settings['isWidgetHidden'] ) ) {
				$sanitized_settings['isWidgetHidden'] = false !== $settings['isWidgetHidden'];
			}

			return $sanitized_settings;
		};
	}
}
