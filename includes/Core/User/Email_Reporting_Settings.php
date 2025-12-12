<?php
/**
 * Class Google\Site_Kit\Core\User\Email_Reporting_Settings
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for email reporting settings.
 *
 * @since 1.161.0
 * @access private
 * @ignore
 */
class Email_Reporting_Settings extends User_Setting {

	/**
	 * The user option name for email reporting setting.
	 */
	const OPTION = 'googlesitekit_email_reporting_settings';

	const FREQUENCY_WEEKLY    = 'weekly';
	const FREQUENCY_MONTHLY   = 'monthly';
	const FREQUENCY_QUARTERLY = 'quarterly';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.161.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.161.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'subscribed' => false,
			'frequency'  => self::FREQUENCY_WEEKLY,
		);
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.161.0
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
			'subscribed' => true,
			'frequency'  => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Gets the meta key used to store the setting.
	 *
	 * @since 1.167.0
	 *
	 * @return string Meta key for the user option.
	 */
	public function get_meta_key() {
		return $this->user_options->get_meta_key( static::OPTION );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.161.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			$sanitized_settings = array();

			if ( isset( $settings['subscribed'] ) ) {
				$sanitized_settings['subscribed'] = (bool) $settings['subscribed'];
			}

			if ( array_key_exists( 'frequency', $settings ) ) {
				if ( is_string( $settings['frequency'] ) ) {
					$sanitized_settings['frequency'] = $settings['frequency'];
				} else {
					$sanitized_settings['frequency'] = self::FREQUENCY_WEEKLY;
				}

				if ( ! in_array( $sanitized_settings['frequency'], array( self::FREQUENCY_WEEKLY, self::FREQUENCY_MONTHLY, self::FREQUENCY_QUARTERLY ), true ) ) {
					$sanitized_settings['frequency'] = self::FREQUENCY_WEEKLY;
				}
			}

			return $sanitized_settings;
		};
	}

	/**
	 * Accessor for the `subscribed` setting.
	 *
	 * @since 1.161.0
	 *
	 * @return bool TRUE if user is subscribed, otherwise FALSE.
	 */
	public function is_user_subscribed() {
		return $this->get()['subscribed'];
	}
}
