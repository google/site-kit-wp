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

use Google\Site_Kit\Core\Storage\User_Aware_Interface;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for email reporting settings.
 *
 * @since 1.161.0
 * @access private
 * @ignore
 */
class Email_Reporting_Settings extends User_Setting implements User_Aware_Interface {

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
	 * Gets the ID of the user the settings are read from and written to.
	 *
	 * @since n.e.x.t
	 *
	 * @return int User ID.
	 */
	public function get_user_id() {
		return $this->user_options->get_user_id();
	}

	/**
	 * Switches the user the settings are read from and written to.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID.
	 * @return callable A closure to switch back to the original user.
	 */
	public function switch_user( $user_id ) {
		return $this->user_options->switch_user( $user_id );
	}

	/**
	 * Checks whether a raw settings value marks the user as subscribed.
	 *
	 * Callers that read the settings meta in bulk (user listings, subscriber counts)
	 * use this instead of loading a settings instance per user.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $settings Raw settings value, as stored in user meta.
	 * @return bool TRUE if the settings mark the user as subscribed, otherwise FALSE.
	 */
	public static function is_subscribed( $settings ) {
		return is_array( $settings ) && ! empty( $settings['subscribed'] );
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
		return self::is_subscribed( $this->get() );
	}
}
