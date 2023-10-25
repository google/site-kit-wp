<?php

/**
 * MockableTime
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

class MockableTime {

	private static $mocked_time = null;

	public static function set_mocked_time( $time, $is_str = false ) {
		self::$mocked_time = $is_str ? strtotime( $time ) : $time;
	}

	public static function time() {
		if ( self::$mocked_time ) {
			return self::$mocked_time;
		}

		return time();
	}

	public static function gmdate( $format, $timestamp = null ) {
		return gmdate( $format, $timestamp ? $timestamp : self::time() );
	}

	public static function strtotime( $datetime, $timestamp = null ) {
		return strtotime( $datetime, $timestamp ? $timestamp : self::time() );
	}

	/**
	 * Returns a date string for the given number of days ago.
	 *
	 * @param int $days_ago The number of days ago.
	 * @return string The date string, formatted as YYYY-MM-DD.
	 */
	public static function days_ago( $days_ago ) {
		return self::gmdate( 'Y-m-d', self::strtotime( $days_ago . ' days ago' ) );
	}

	public static function reset() {
		self::$mocked_time = null;
	}
}
