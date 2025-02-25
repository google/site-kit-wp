<?php
/**
 * Class Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Settings
 *
 * @package   Google\Site_Kit\Core\Tags\First_Party_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\First_Party_Mode;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class to store user First Party Mode settings.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
class First_Party_Mode_Settings extends Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_first_party_mode';

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
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isEnabled'             => false,
			'isFPMHealthy'          => null,
			'isScriptAccessEnabled' => null,
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

			if ( isset( $value['isFPMHealthy'] ) ) {
				$new_value['isFPMHealthy'] = (bool) $value['isFPMHealthy'];
			}

			if ( isset( $value['isScriptAccessEnabled'] ) ) {
				$new_value['isScriptAccessEnabled'] = (bool) $value['isScriptAccessEnabled'];
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
			'isFPMHealthy'          => true,
			'isScriptAccessEnabled' => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		return $this->set( array_merge( $settings, $updated ) );
	}
}
