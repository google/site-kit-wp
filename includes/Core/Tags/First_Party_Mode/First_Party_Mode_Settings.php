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
 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isEnabled'             => null,
			'isFPMHealthy'          => null,
			'isScriptAccessEnabled' => null,
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
}
