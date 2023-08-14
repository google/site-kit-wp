<?php
/**
 * Class Google\Site_Kit\Core\Util\URL
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class for custom date parsing methods.
 *
 * @since 1.99.0
 * @access private
 * @ignore
 */
class Date {

	/**
	 * Parses a date range string into a start date and an end date.
	 *
	 * @since 1.99.0
	 *
	 * @param string $range         Date range string. Either 'last-7-days', 'last-14-days', 'last-90-days', or
	 *                              'last-28-days' (default).
	 * @param string $multiplier    Optional. How many times the date range to get. This value can be specified if the
	 *                              range should be request multiple times back. Default 1.
	 * @param int    $offset        Days the range should be offset by. Default 1. Used by Search Console where
	 *                              data is delayed by two days.
	 * @param bool   $previous      Whether to select the previous period. Default false.
	 * @return array List with two elements, the first with the start date and the second with the end date, both as 'Y-m-d'.
	 */
	public static function parse_date_range( $range, $multiplier = 1, $offset = 1, $previous = false ) {
		preg_match( '*-(\d+)-*', $range, $matches );
		$number_of_days = $multiplier * ( isset( $matches[1] ) ? $matches[1] : 28 );

		// Calculate the end date. For previous period requests, offset period by the number of days in the request.
		$end_date_offset = $previous ? $offset + $number_of_days : $offset;
		$date_end        = gmdate( 'Y-m-d', strtotime( $end_date_offset . ' days ago' ) );

		// Set the start date.
		$start_date_offset = $end_date_offset + $number_of_days - 1;
		$date_start        = gmdate( 'Y-m-d', strtotime( $start_date_offset . ' days ago' ) );

		return array( $date_start, $date_end );
	}

}
