<?php
/**
 * Class Google\Site_Kit\Core\User\Proactive_User_Engagement_Settings
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for proactive user engagement settings.
 *
 * @since 1.161.0
 * @access private
 * @ignore
 */
class Proactive_User_Engagement_Settings extends User_Setting {

	/**
	 * The user option name for proactive user engagement setting.
	 */
	const OPTION = 'googlesitekit_proactive_user_engagement_settings';

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
			'frequency'  => 'weekly',
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
					$sanitized_settings['frequency'] = 'weekly';
				}

				if ( ! in_array( $sanitized_settings['frequency'], array( 'weekly', 'monthly', 'quarterly' ), true ) ) {
					$sanitized_settings['frequency'] = 'weekly';
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
