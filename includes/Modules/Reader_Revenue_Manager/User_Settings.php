<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\User_Settings
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for per-user Reader Revenue Manager settings.
 *
 * @since 1.185.0
 * @access private
 */
class User_Settings extends User_Setting {

	/**
	 * The user option name for Reader Revenue Manager settings.
	 */
	const OPTION = 'googlesitekit_reader-revenue-manager_user-settings';

	/**
	 * Allowed top-level setting keys.
	 */
	const SETTING_KEYS = array( 'lastActionedExpressSetups' );

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.185.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.185.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'lastActionedExpressSetups' => array(),
		);
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.185.0
	 *
	 * @param array $partial Partial settings array to save.
	 * @return bool True on success, false on failure.
	 */
	public function merge( array $partial ) {
		$defaults = $this->get_default();
		$settings = $this->get();

		$updated = array_intersect_key( $partial, $defaults );

		foreach ( $updated as $key => $new_value ) {
			$old_value = $settings[ $key ] ?? $defaults[ $key ];

			if ( 'lastActionedExpressSetups' === $key ) {
				$updated[ $key ] = $this->merge_last_actioned_express_setups( $old_value, $new_value );
			}
		}

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.185.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			$sanitized_settings = array();

			foreach ( self::SETTING_KEYS as $key ) {
				if ( ! isset( $settings[ $key ] ) ) {
					continue;
				}

				if ( 'lastActionedExpressSetups' === $key ) {
					$sanitized_settings[ $key ] = $this->sanitize_last_actioned_express_setups( $settings[ $key ] );
				}
			}

			return $sanitized_settings;
		};
	}

	/**
	 * Merges the last actioned express setups.
	 *
	 * @since 1.185.0
	 *
	 * @param array $old_value Current value..
	 * @param mixed $new_value Value to merge.
	 * @return array The merged express setup timestamps.
	 */
	private function merge_last_actioned_express_setups( $old_value, $new_value ) {
		if ( ! is_array( $new_value ) ) {
			return $old_value;
		}

		return array_merge( $old_value, $new_value );
	}

	/**
	 * Sanitizes the last actioned express setups.
	 *
	 * @since 1.185.0
	 *
	 * @param mixed $value Value to sanitize.
	 * @return array The sanitized express setup timestamps.
	 */
	private function sanitize_last_actioned_express_setups( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		return array_filter(
			$value,
			function ( $timestamp, $key ) {
				return is_string( $key ) && is_int( $timestamp );
			},
			ARRAY_FILTER_USE_BOTH
		);
	}
}
