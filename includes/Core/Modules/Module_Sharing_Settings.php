<?php
/**
 * Class Google\Site_Kit\Core\Modules\Module_Sharing_Settings
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for module sharing settings.
 *
 * @since 1.50.0
 * @access private
 * @ignore
 */
class Module_Sharing_Settings extends Setting {

	const OPTION = 'googlesitekit_dashboard_sharing';

	/**
	 * Gets the default value.
	 *
	 * @since 1.50.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.50.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.50.0
	 *
	 * @return callable Callback method that filters or type casts invalid setting values.
	 */
	protected function get_sanitize_callback() {
		return function( $option ) {
			if ( ! is_array( $option ) ) {
				return array();
			}
			$sanitized_option = array();
			foreach ( $option as $module_slug => $sharing_settings ) {
				$sanitized_option[ $module_slug ] = array();

				if ( isset( $sharing_settings['sharedRoles'] ) ) {
					$sanitized_option[ $module_slug ]['sharedRoles'] = $this->sanitize_string_list( $sharing_settings['sharedRoles'] );
				}

				if ( isset( $sharing_settings['management'] ) ) {
					$sanitized_option[ $module_slug ]['management'] = (string) $sharing_settings['management'];
				}
			}

			return $sanitized_option;
		};
	}

	/**
	 * Filters empty or non-string elements from a given array.
	 *
	 * @since 1.50.0
	 *
	 * @param array $elements Array to check.
	 * @return array Empty array or a filtered array containing only non-empty strings.
	 */
	private function sanitize_string_list( $elements = array() ) {
		if ( ! is_array( $elements ) ) {
			$elements = array( $elements );
		}

		if ( empty( $elements ) ) {
			return array();
		}

		$filtered_elements = array_filter(
			$elements,
			function( $element ) {
				return is_string( $element ) && ! empty( $element );
			}
		);
		// Avoid index gaps for filtered values.
		return array_values( $filtered_elements );
	}

	/**
	 * Gets the settings after filling in default values.
	 *
	 * @since 1.50.0
	 *
	 * @return array Value set for the option, or registered default if not set.
	 */
	public function get() {
		$settings = parent::get();

		foreach ( $settings as $module_slug => $sharing_settings ) {
			if ( ! isset( $sharing_settings['sharedRoles'] ) || ! is_array( $sharing_settings['sharedRoles'] ) ) {
				$settings[ $module_slug ]['sharedRoles'] = array();
			}
			if ( ! isset( $sharing_settings['management'] ) || ! in_array( $sharing_settings['management'], array( 'all_admins', 'owner' ), true ) ) {
				$settings[ $module_slug ]['management'] = 'owner';
			}
		}

		return $settings;
	}

	/**
	 * Unsets the settings for a given module.
	 *
	 * @since 1.68.0
	 *
	 * @param string $slug Module slug.
	 */
	public function unset_module( $slug ) {
		$settings = $this->get();

		if ( isset( $settings[ $slug ] ) ) {
			unset( $settings[ $slug ] );
			$this->set( $settings );
		}
	}
}
