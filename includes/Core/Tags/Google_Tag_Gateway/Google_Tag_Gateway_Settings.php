<?php
/**
 * Class Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings
 *
 * @package   Google\Site_Kit\Core\Tags\Google_Tag_Gateway
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class to store user Google Tag Gateway settings.
 *
 * @since 1.141.0
 * @since 1.157.0 Renamed from First_Party_Mode_Settings to Google_Tag_Gateway_Settings.
 * @access private
 * @ignore
 */
class Google_Tag_Gateway_Settings extends Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_google_tag_gateway';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.141.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Moved health status to Google_Tag_Gateway_Health setting.
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isEnabled' => false,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Removed health status sanitization (moved to Google_Tag_Gateway_Health).
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['isEnabled'] ) ) {
				$new_value['isEnabled'] = (bool) $value['isEnabled'];
			}

			return $new_value;
		};
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Only merges isEnabled (health status moved to Google_Tag_Gateway_Health).
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
			'isEnabled' => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Checks if Google tag gateway is active.
	 *
	 * @since 1.162.0
	 * @since n.e.x.t Deprecated. Use Google_Tag_Gateway::is_ready_and_active() instead.
	 *
	 * @return bool True if Google tag gateway is active, false otherwise.
	 */
	public function is_google_tag_gateway_active() {
		_deprecated_function( __METHOD__, 'n.e.x.t', 'Google_Tag_Gateway::is_ready_and_active' );

		$settings = $this->get();

		return isset( $settings['isEnabled'] ) && $settings['isEnabled'];
	}
}
