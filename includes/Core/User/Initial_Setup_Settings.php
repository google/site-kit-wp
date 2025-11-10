<?php
/**
 * Class Google\Site_Kit\Core\User\Initial_Setup_Settings
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for initial setup settings.
 *
 * @since 1.164.0
 * @access private
 * @ignore
 */
class Initial_Setup_Settings extends User_Setting {

	/**
	 * The user option name for the initial setup setting.
	 */
	const OPTION = 'googlesitekit_initial_setup';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.164.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.164.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isAnalyticsSetupComplete' => null,
		);
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.164.0
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
			'isAnalyticsSetupComplete' => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.164.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			if ( isset( $settings['isAnalyticsSetupComplete'] ) ) {
				$settings['isAnalyticsSetupComplete'] = (bool) $settings['isAnalyticsSetupComplete'];
			}

			return $settings;
		};
	}
}
