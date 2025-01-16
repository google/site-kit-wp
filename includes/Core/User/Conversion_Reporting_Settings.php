<?php
/**
 * Class Google\Site_Kit\Core\User\Conversion_Reporting_Settings
 *
 * @package   Google\Site_Kit\Core\Conversion_Reporting
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for handling conversion reporting settings rest routes.
 *
 * @since 1.144.0
 * @access private
 * @ignore
 */
class Conversion_Reporting_Settings extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_conversion_reporting_settings';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.144.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.144.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'newEventsCalloutDismissedAt'  => 0,
			'lostEventsCalloutDismissedAt' => 0,
		);
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.144.0
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
			'newEventsCalloutDismissedAt'  => true,
			'lostEventsCalloutDismissedAt' => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.144.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			if ( isset( $settings['newEventsCalloutDismissedAt'] ) ) {
				if ( ! is_int( $settings['newEventsCalloutDismissedAt'] ) ) {
					$settings['newEventsCalloutDismissedAt'] = 0;
				}
			}

			if ( isset( $settings['lostEventsCalloutDismissedAt'] ) ) {
				if ( ! is_int( $settings['lostEventsCalloutDismissedAt'] ) ) {
					$settings['lostEventsCalloutDismissedAt'] = 0;
				}
			}

			return $settings;
		};
	}
}
