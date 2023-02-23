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
use Google\Site_Kit\Core\Util\Sanitize;

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
					$filtered_shared_roles = $this->filter_shared_roles( Sanitize::sanitize_string_list( $sharing_settings['sharedRoles'] ) );

					$sanitized_option[ $module_slug ]['sharedRoles'] = $filtered_shared_roles;
				}

				if ( isset( $sharing_settings['management'] ) ) {
					$sanitized_option[ $module_slug ]['management'] = (string) $sharing_settings['management'];
				}
			}

			return $sanitized_option;
		};
	}

	/**
	 * Filters the shared roles to only include roles with the edit_posts capability.
	 *
	 * @since 1.85.0.
	 *
	 * @param array $shared_roles The shared roles list.
	 * @return string[] The sanitized shared roles list.
	 */
	private function filter_shared_roles( array $shared_roles ) {
		$filtered_shared_roles = array_filter(
			$shared_roles,
			function( $role_slug ) {
				$role = get_role( $role_slug );

				if ( empty( $role ) || ! $role->has_cap( 'edit_posts' ) ) {
					return false;
				}

				return true;
			}
		);

		return array_values( $filtered_shared_roles );
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

			if ( isset( $sharing_settings['sharedRoles'] ) && is_array( $sharing_settings['sharedRoles'] ) ) {
				$filtered_shared_roles                   = $this->filter_shared_roles( $sharing_settings['sharedRoles'] );
				$settings[ $module_slug ]['sharedRoles'] = $filtered_shared_roles;
			}
		}

		return $settings;
	}

	/**
	 * Merges a partial Module_Sharing_Settings option array into existing sharing settings.
	 *
	 * @since 1.75.0
	 * @since 1.77.0 Removed capability checks.
	 *
	 * @param array $partial Partial settings array to update existing settings with.
	 *
	 * @return bool True if sharing settings option was updated, false otherwise.
	 */
	public function merge( array $partial ) {
		$settings = $this->get();
		$partial  = array_filter(
			$partial,
			function ( $value ) {
				return ! empty( $value );
			}
		);

		return $this->set( $this->array_merge_deep( $settings, $partial ) );
	}

	/**
	 * Gets the sharing settings for a given module, or the defaults.
	 *
	 * @since 1.95.0
	 *
	 * @param string $slug Module slug.
	 * @return array {
	 *     Sharing settings for the given module.
	 *     Default sharing settings do not grant any access so they
	 *     are safe to return for a non-existent or non-shareable module.
	 *
	 *     @type array  $sharedRoles A list of WP Role IDs that the module is shared with.
	 *     @type string $management  Which users can manage the sharing settings.
	 * }
	 */
	public function get_module( $slug ) {
		$settings = $this->get();

		if ( isset( $settings[ $slug ] ) ) {
			return $settings[ $slug ];
		}

		return array(
			'sharedRoles' => array(),
			'management'  => 'owner',
		);
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

	/**
	 * Gets the combined roles that are set as shareable for all modules.
	 *
	 * @since 1.69.0
	 *
	 * @return array Combined array of shared roles for all modules.
	 */
	public function get_all_shared_roles() {
		$shared_roles = array();
		$settings     = $this->get();
		foreach ( $settings as $sharing_settings ) {
			if ( ! isset( $sharing_settings['sharedRoles'] ) ) {
				continue;
			}

			$shared_roles = array_merge( $shared_roles, $sharing_settings['sharedRoles'] );
		}
		return array_unique( $shared_roles );
	}

	/**
	 * Gets the shared roles for the given module slug.
	 *
	 * @since 1.69.0
	 *
	 * @param string $slug Module slug.
	 * @return array list of shared roles for the module, otherwise an empty list.
	 */
	public function get_shared_roles( $slug ) {
		$settings = $this->get();

		if ( isset( $settings[ $slug ]['sharedRoles'] ) ) {
			return $settings[ $slug ]['sharedRoles'];
		}

		return array();
	}

	/**
	 * Merges two arrays recursively to a specific depth.
	 *
	 * When array1 and array2 have the same string keys, it overwrites
	 * the elements of array1 with elements of array2. Otherwise, it adds/appends
	 * elements of array2.
	 *
	 * @since 1.77.0
	 *
	 * @param array $array1 First array.
	 * @param array $array2 Second array.
	 * @param int   $depth Optional. Depth to merge to. Default is 1.
	 *
	 * @return array Merged array.
	 */
	private function array_merge_deep( $array1, $array2, $depth = 1 ) {
		foreach ( $array2 as $key => $value ) {
			if ( $depth > 0 && is_array( $value ) ) {
				$array1_key     = isset( $array1[ $key ] ) ? $array1[ $key ] : null;
				$array1[ $key ] = $this->array_merge_deep( $array1_key, $value, $depth - 1 );
			} else {
				$array1[ $key ] = $value;
			}
		}

		return $array1;
	}

}
