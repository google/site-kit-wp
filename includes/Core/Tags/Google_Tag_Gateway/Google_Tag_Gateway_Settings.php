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
	 * Registers the GTG settings.
	 *
	 * @since 1.162.0
	 */
	public function register() {
		parent::register();

		$this->add_option_default_filters();
	}

	/**
	 * Registers a filter to ensure default values are present in the saved option.
	 *
	 * @since 1.162.0
	 */
	protected function add_option_default_filters() {
		// Ensure that a non-array is never saved as the option value.
		add_filter(
			'option_' . static::OPTION,
			function ( $option ) {
				if ( ! is_array( $option ) ) {
					return $this->get_default();
				}
				return $option;
			},
			0
		);

		// Fill in any missing keys with defaults.
		//
		// This is particularly important for newly added settings like `isGTGDefault`
		// which won't exist in the database for existing sites. The filter ensures that
		// if GTG settings exist but there are missing new fields (like `isGTGDefault`), those
		// missing fields are filled in with appropriate values.
		add_filter(
			'option_' . static::OPTION,
			function ( $option ) {
				if ( is_array( $option ) ) {
					$defaults = $this->get_default();

					// Special logic for `isGTGDefault`: If GTG settings already exist and GTG was
					// previously enabled, set `isGTGDefault` to false (user has interacted with settings).
					// Otherwise, use the default value (true).
					if ( ! isset( $option['isGTGDefault'] ) && ! empty( $option['isEnabled'] ) ) {
						$defaults['isGTGDefault'] = false;
					}

					return $option + $defaults;
				}
				return $option;
			},
			99
		);
	}

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
	 * @since 1.162.0 Add `isGTGDefault` setting to track if the user has ever interacted with GTG settings.
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isEnabled'             => false,
			'isGTGHealthy'          => null,
			'isScriptAccessEnabled' => null,
			'isGTGDefault'          => true,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.141.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['isEnabled'] ) ) {
				$new_value['isEnabled'] = (bool) $value['isEnabled'];
			}

			if ( isset( $value['isGTGHealthy'] ) ) {
				$new_value['isGTGHealthy'] = (bool) $value['isGTGHealthy'];
			}

			if ( isset( $value['isScriptAccessEnabled'] ) ) {
				$new_value['isScriptAccessEnabled'] = (bool) $value['isScriptAccessEnabled'];
			}

			if ( isset( $value['isGTGDefault'] ) ) {
				$new_value['isGTGDefault'] = (bool) $value['isGTGDefault'];
			}

			return $new_value;
		};
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.141.0
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
			'isEnabled'             => true,
			'isGTGHealthy'          => true,
			'isScriptAccessEnabled' => true,
			'isGTGDefault'          => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Checks if Google tag gateway is active.
	 *
	 * @since 1.162.0
	 *
	 * @return bool True if Google tag gateway is active, false otherwise.
	 */
	public function is_google_tag_gateway_active() {
		$settings          = $this->get();
		$required_settings = array( 'isEnabled', 'isGTGHealthy', 'isScriptAccessEnabled' );

		foreach ( $required_settings as $setting ) {
			if ( ! isset( $settings[ $setting ] ) || ! $settings[ $setting ] ) {
				return false;
			}
		}

		return true;
	}
}
