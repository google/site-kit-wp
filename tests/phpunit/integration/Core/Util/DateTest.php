<?php
/**
 * DateTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class DateTest extends TestCase {

	public function test_reference_date() {
		$this->assertNull(
			Date::reference_date(),
			'Reference date should default to null when unfiltered.'
		);

		add_filter(
			'googlesitekit_reference_date',
			function () {
				return '2024-05-15';
			}
		);

		$this->assertEquals(
			'2024-05-15',
			Date::reference_date(),
			'Reference date should return the filtered date string.'
		);
	}

	public function test_now_unfiltered() {
		$now = time();

		$this->assertEqualsWithDelta(
			$now,
			Date::now(),
			2,
			'Date::now() should return the current timestamp within 2 seconds when unfiltered.'
		);
	}

	public function test_now_with_valid_reference_date() {
		$custom_date = '2024-05-15';
		$expected    = strtotime( $custom_date );

		add_filter(
			'googlesitekit_reference_date',
			function () use ( $custom_date ) {
				return $custom_date;
			}
		);

		$this->assertEquals(
			$expected,
			Date::now(),
			'Date::now() should return the timestamp corresponding to the filtered reference date.'
		);
	}

	public function test_now_with_invalid_reference_date() {
		add_filter(
			'googlesitekit_reference_date',
			function () {
				return 'invalid-date-format';
			}
		);

		$now = time();

		$this->assertEqualsWithDelta(
			$now,
			Date::now(),
			2,
			'Date::now() should fall back to current timestamp when filtered reference date is unparseable.'
		);
	}

	/**
	 * @dataProvider data_date_ranges
	 *
	 * @param string $range         Date range string.
	 * @param int    $multiplier    Range multiplier.
	 * @param int    $offset        Day offset.
	 * @param bool   $previous      Whether previous period is requested.
	 * @param int    $expected_days Expected number of days.
	 */
	public function test_parse_date_range( $range, $multiplier, $offset, $previous, $expected_days ) {
		list( $start_date, $end_date ) = Date::parse_date_range( $range, $multiplier, $offset, $previous );

		$end_offset   = $previous ? $offset + $expected_days : $offset;
		$start_offset = $end_offset + $expected_days - 1;

		$expected_end   = gmdate( 'Y-m-d', strtotime( "{$end_offset} days ago" ) );
		$expected_start = gmdate( 'Y-m-d', strtotime( "{$start_offset} days ago" ) );

		$this->assertEquals(
			$expected_start,
			$start_date,
			'Start date should match expected start date based on offset and duration.'
		);

		$this->assertEquals(
			$expected_end,
			$end_date,
			'End date should match expected end date based on offset.'
		);
	}

	public function data_date_ranges() {
		return array(
			'default last-7-days'                          => array(
				'last-7-days',
				1,
				1,
				false,
				7,
			),
			'default last-14-days'                         => array(
				'last-14-days',
				1,
				1,
				false,
				14,
			),
			'default last-28-days'                         => array(
				'last-28-days',
				1,
				1,
				false,
				28,
			),
			'default last-90-days'                         => array(
				'last-90-days',
				1,
				1,
				false,
				90,
			),
			'fallback to 28 days for range without digits' => array(
				'custom-range',
				1,
				1,
				false,
				28,
			),
			'with multiplier 2 on last-28-days'            => array(
				'last-28-days',
				2,
				1,
				false,
				56,
			),
			'with offset 2 for Search Console delayed data' => array(
				'last-28-days',
				1,
				2,
				false,
				28,
			),
			'previous period comparison'                   => array(
				'last-28-days',
				1,
				1,
				true,
				28,
			),
			'previous period with custom offset'           => array(
				'last-14-days',
				1,
				2,
				true,
				14,
			),
			'previous period with multiplier'              => array(
				'last-7-days',
				2,
				1,
				true,
				14,
			),
		);
	}
}
