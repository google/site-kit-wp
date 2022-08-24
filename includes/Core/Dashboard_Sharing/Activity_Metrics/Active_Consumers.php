<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Active_Consumers
 *
 * @package   Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics;

use Closure;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing active consumers for an access token.
 *
 * @since 1.82.0
 * @access private
 * @ignore
 */
class Active_Consumers extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_active_consumers';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.82.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.82.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.82.0
	 *
	 * @return Closure
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			// If the new value is not an array, preserve current value.
			if ( ! is_array( $value ) ) {
				return $this->get();
			}

			$results = array();

			foreach ( $value as $id => $roles ) {
				// If any of the IDs isn't an integer, do not include that item.
				if ( ! is_int( $id ) ) {
					continue;
				}

				// If any of the array values isn't an array, do not include that item.
				if ( ! is_array( $roles ) ) {
					continue;
				}

				$user_roles = array();

				foreach ( $roles as $role ) {
					// If the nested role item is a string, include that role item.
					if ( is_string( $role ) ) {
						$user_roles[] = $role;
					}
				}

				if ( ! empty( $user_roles ) ) {
					$results[ $id ] = $user_roles;
				}
			}

			return $results;
		};
	}
}
