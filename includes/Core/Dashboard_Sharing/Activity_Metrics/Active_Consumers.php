<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\Active_Consumers
 *
 * @package   Google\Site_Kit\Core\Dashboard_Sharing
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing;

use Closure;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing active consumers for an access token.
 *
 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return Closure
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			// If the new value is not an array, preserve current value.
			if ( ! is_array( $value ) ) {
				return $this->get();
			}

			// If the new value is not an associative array, preserve current value.
			if ( array_values( $value ) === $value ) {
				return $this->get();
			}

			// If any of the array keys isn't an integer, preserve current value.
			if ( count(
				array_filter(
					array_keys( $value ),
					function( $item ) {
						return ! is_int( $item );
					}
				)
			) > 0 ) {
				return $this->get();
			}

			// If any of the array values isn't an array, or any of the values of
			// the nested arrays isn't a string, preserve current value.
			if ( count(
				array_filter(
					array_values( $value ),
					function( $item ) {
						if ( ! is_array( $item ) ) {
							return true;
						}

						if ( count(
							array_filter(
								array_values( $item ),
								function( $role_item ) {
									return ! is_string( $role_item );
								}
							)
						) > 0 ) {
							return true;
						}

						return false;
					}
				)
			) > 0 ) {
				return $this->get();
			}

			return $value;
		};
	}
}
