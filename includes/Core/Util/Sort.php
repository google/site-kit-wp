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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Sort {
	/**
	 * Sorts the provided list in a case-insensitive manner.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $list    The list to sort.
	 * @param string $orderby The field by which the list should be ordered by.
	 * @param string $order   The direction of the sort. Either 'ASC' or 'DESC'. Default is 'ASC'.
	 *
	 * @return array The sorted list.
	 */
	public static function case_insensitive_list_sort( $list, $orderby, $order = 'ASC' ) {
		usort(
			$list,
			function ( $a, $b ) use ( $orderby, $order ) {
				if ( 'DESC' === $order ) {
					return strcasecmp(
						$b[ $orderby ],
						$a[ $orderby ]
					);
				}

				return strcasecmp(
					$a[ $orderby ],
					$b[ $orderby ]
				);
			}
		);

		return $list;
	}
}
