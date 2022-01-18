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
 * Base class for module sharing settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Module_Sharing_Settings extends Setting {

	const OPTION = 'googlesitekit_dashboard_sharing';

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_default() {
		return array();
	}

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
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function( $option ) {
			if ( is_array( $option ) ) {
				foreach ( $option as &$sharing_settings ) {
					if ( isset( $sharing_settings['sharedRoles'] ) ) {
						$sharing_settings['sharedRoles'] = $this->filter_valid_roles( $sharing_settings['sharedRoles'] );
					}
					if ( isset( $sharing_settings['management'] ) ) {
						$sharing_settings['management'] = (string) $sharing_settings['management'];
					}
				}
			}
			return $option;
		};
	}

	/**
	 * Removes invalid roles from a given array.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $roles Array of roles to check.
	 * @return array Filtered array of roles that exist in the current site.
	 */
	private function filter_valid_roles( $roles = array() ) {
		if ( ! is_array( $roles ) ) {
			$roles = array( $roles );
		}

		if ( empty( $roles ) ) {
			return array();
		}

		$valid_roles    = wp_roles()->role_names;
		$filtered_roles = array_filter(
			$roles,
			function( $role ) use ( $valid_roles ) {
				return in_array( $role, array_keys( $valid_roles ), true );
			}
		);
		// Avoid index gaps for filtered values.
		return array_values( $filtered_roles );
	}

}
