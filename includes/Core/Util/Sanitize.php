<?php
/**
 * Class Google\Site_Kit\Core\Util\Sanitize
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Utility class for sanitizing data.
 *
 * @since 1.93.0
 * @access private
 * @ignore
 */
class Sanitize {

	/**
	 * Filters empty or non-string elements from a given array.
	 *
	 * @since 1.93.0
	 *
	 * @param array $elements Array to check.
	 * @return array Empty array or a filtered array containing only non-empty strings.
	 */
	public static function sanitize_string_list( $elements = array() ) {
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

}
