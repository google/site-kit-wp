<?php
/**
 * Class Google\Site_Kit\Core\Util\Sort
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Utility class for sorting lists.
 *
 * @since 1.90.0
 * @access private
 * @ignore
 */
class Sort {
	/**
	 * Sorts the provided list in a case-insensitive manner.
	 *
	 * @since 1.90.0
	 *
	 * @param array  $list    The list to sort.
	 * @param string $orderby The field by which the list should be ordered by.
	 *
	 * @return array The sorted list.
	 */
	public static function case_insensitive_list_sort( array $list, $orderby ) {
		usort(
			$list,
			function ( $a, $b ) use ( $orderby ) {
				if ( is_array( $a ) && is_array( $b ) ) {
					return strcasecmp(
						$a[ $orderby ],
						$b[ $orderby ]
					);
				}

				if ( is_object( $a ) && is_object( $b ) ) {
					return strcasecmp(
						$a->$orderby,
						$b->$orderby
					);
				}

				return 0;
			}
		);

		return $list;
	}
}
