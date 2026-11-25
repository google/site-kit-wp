<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Typical_Traffic_AvailabilityTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use DateTimeImmutable;
use DateTimeZone;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Period_Baseline;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Typical_Traffic_Availability;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Typical_Traffic_AvailabilityTest extends TestCase {

	/**
	 * The service's availability fixtures, copied unchanged from
	 * `internal/ai/testdata/typical_traffic_availability.json` in the service.
	 */
	const FIXTURES_PATH = __DIR__ . '/fixtures/typical-traffic-availability.json';

	/**
	 * The number of cases the service's availability fixtures have.
	 */
	const FIXTURE_CASE_COUNT = 30;

	public function test_data_availability_fixtures__provides_every_case() {
		$this->assertCount(
			self::FIXTURE_CASE_COUNT,
			$this->data_availability_fixtures(),
			'The data provider should provide every case of the service\'s availability fixtures.'
		);
	}

	/**
	 * @dataProvider data_availability_fixtures
	 *
	 * @param array $fixture_case The case: the range's length, the days of history up to its end date, the end date, and the expected availability.
	 */
	public function test_get__matches_the_availability_fixture( array $fixture_case ) {
		// The fixture leaves out a date the site has no history for. The
		// service's rules have no longest period and no low traffic state, no
		// fixture's period is longer than 364 days, and every fixture's site
		// has over 100 visits a day.
		$expected = array_merge(
			array(
				'band_available_from'        => null,
				'key_factors_available_from' => null,
				'range_too_long'             => false,
				'low_traffic'                => false,
			),
			$fixture_case['expected']
		);

		$availability = Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_daily_rows( $fixture_case['end_date'], $fixture_case['history_days'] ) ),
			$fixture_case['end_date'],
			$fixture_case['range_days']
		);

		ksort( $expected );
		ksort( $availability );

		$this->assertSame( $expected, $availability, 'The availability should match the fixture of the service.' );
	}

	public function data_availability_fixtures() {
		$cases = array();

		foreach ( json_decode( file_get_contents( self::FIXTURES_PATH ), true ) as $fixture_case ) {
			$cases[ "{$fixture_case['range_days']} days, {$fixture_case['history_days']} of history" ] = array( $fixture_case );
		}

		return $cases;
	}

	public function test_get__waits_for_the_band_and_the_previous_period_of_a_28_day_period() {
		$availability = fn( $history_days ) => Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_daily_rows( '2026-09-15', $history_days ) ),
			'2026-09-15',
			28
		);

		$this->assertFalse( $availability( 55 )['key_factors_available'], 'A 28-day period should have no key factors while a day of the previous period is before the history.' );
		$this->assertFalse( $availability( 55 )['insight_request_allowed'], 'A 28-day period should get no insight request without its key factors.' );
		$this->assertTrue( $availability( 56 )['insight_request_allowed'], 'A 28-day period should get an insight request once the previous period is in the history.' );
		$this->assertFalse( $availability( 110 )['performance_insight_available'], 'A 28-day period should show no analysis without its band.' );
		$this->assertTrue( $availability( 111 )['band_available'], 'A 28-day period should have a band from 111 days of history.' );
		$this->assertTrue( $availability( 111 )['performance_insight_available'], 'A 28-day period should show the analysis with its band and its request.' );
		$this->assertSame( '2026-09-15', $availability( 111 )['band_available_from'], 'With 111 days of history, the band should be available from the end date.' );
	}

	public function test_get__has_the_band_of_a_90_day_period_before_its_key_factors() {
		$availability = Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_daily_rows( '2026-09-15', 173 ) ),
			'2026-09-15',
			90
		);

		$this->assertTrue( $availability['band_available'], 'A 90-day period should have its band from 173 days of history.' );
		$this->assertFalse( $availability['key_factors_available'], 'A 90-day period should have no key factors before 180 days of history.' );
		$this->assertFalse( $availability['insight_request_allowed'], 'A 90-day period should get no insight request before its key factors.' );
		$this->assertFalse( $availability['performance_insight_available'], 'A 90-day period should show no analysis without its insight request, band or not.' );
		$this->assertSame( '2026-09-22', $availability['key_factors_available_from'], 'The key factors should be available a week later, once the history holds 180 days.' );
	}

	/**
	 * @dataProvider data_period_lengths_around_the_longest_insight_period
	 *
	 * @param int  $period_days    The period's length in days.
	 * @param bool $range_too_long Whether the period is too long for the insight.
	 */
	public function test_get__requests_no_insight_for_a_period_longer_than_364_days( $period_days, $range_too_long ) {
		// History for the band and the key factor cards of the longest period.
		$availability = Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_daily_rows( '2026-09-15', 2 * 365 ) ),
			'2026-09-15',
			$period_days
		);

		$this->assertTrue( $availability['band_available'], "A $period_days-day period should have its band." );
		$this->assertTrue( $availability['key_factors_available'], "A $period_days-day period should have its key factors." );
		$this->assertSame( $range_too_long, $availability['range_too_long'], "A $period_days-day period should be too long for the insight only above 364 days." );
		$this->assertSame( ! $range_too_long, $availability['insight_request_allowed'], "A $period_days-day period should get an insight request only up to 364 days." );
		$this->assertSame( ! $range_too_long, $availability['performance_insight_available'], "A $period_days-day period should show the analysis only up to 364 days." );
	}

	public function data_period_lengths_around_the_longest_insight_period() {
		return array(
			'364 days' => array( 364, false ),
			'365 days' => array( 365, true ),
		);
	}

	public function test_get__counts_the_history_from_the_first_day_with_visits() {
		$daily_rows = array_merge(
			array_map(
				fn( $row ) => array_merge( $row, array( 'visits' => 0 ) ),
				$this->get_daily_rows( '2026-07-21', 30 )
			),
			$this->get_daily_rows( '2026-09-15', 56 )
		);

		$availability = Typical_Traffic_Availability::get( Period_Baseline::from_daily_series( $daily_rows ), '2026-09-15', 28 );

		$this->assertTrue( $availability['key_factors_available'], 'The 56 days with visits should give a 28-day period its key factors.' );
		$this->assertSame( '2026-09-15', $availability['key_factors_available_from'], 'The history should count from the first day with visits.' );
	}

	public function test_get__has_no_dates_without_history() {
		$availability = Typical_Traffic_Availability::get( new Period_Baseline( array() ), '2026-09-15', 28 );

		$this->assertNull( $availability['band_available_from'], 'A site without history should have no date for the band.' );
		$this->assertNull( $availability['key_factors_available_from'], 'A site without history should have no date for the key factors.' );
		$this->assertFalse( $availability['band_available'], 'A site without history should have no band.' );
		$this->assertFalse( $availability['insight_request_allowed'], 'A site without history should get no insight request.' );
		$this->assertFalse( $availability['low_traffic'], 'A site without history should have no traffic to call low, so its parts say they wait for history.' );
	}

	/**
	 * @dataProvider data_period_lengths
	 *
	 * @param int $period_days The period's length in days.
	 */
	public function test_get__has_low_traffic_under_100_visits_per_28_days_over_the_last_56_days( $period_days ) {
		// A year of 100 visits a day, then 199 visits over the last 56 days:
		// 31 days of 4 visits and 25 days of 3.
		$availability = Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_rows_with_visits( '2026-09-15', array_merge( array_fill( 0, 365, 100 ), array_fill( 0, 31, 4 ), array_fill( 0, 25, 3 ) ) ) ),
			'2026-09-15',
			$period_days
		);

		$this->assertTrue( $availability['low_traffic'], "A $period_days-day period should have low traffic with 199 visits over the last 56 days, whatever the history before them." );
		$this->assertFalse( $availability['band_available'], "A $period_days-day period of a site with low traffic should have no band." );
		$this->assertFalse( $availability['key_factors_available'], "A $period_days-day period of a site with low traffic should have no key factors." );
		$this->assertFalse( $availability['insight_request_allowed'], "A $period_days-day period of a site with low traffic should get no insight request." );
		$this->assertFalse( $availability['performance_insight_available'], "A $period_days-day period of a site with low traffic should show no analysis." );
		$this->assertNotNull( $availability['band_available_from'], 'The band\'s date should count the history alone.' );
		$this->assertNotNull( $availability['key_factors_available_from'], 'The key factors\' date should count the history alone.' );
	}

	/**
	 * @dataProvider data_period_lengths
	 *
	 * @param int $period_days The period's length in days.
	 */
	public function test_get__has_no_low_traffic_at_100_visits_per_28_days_over_the_last_56_days( $period_days ) {
		// 200 visits over the last 56 days: 32 days of 4 visits and 24 of 3.
		$availability = Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_rows_with_visits( '2026-09-15', array_merge( array_fill( 0, 365, 100 ), array_fill( 0, 32, 4 ), array_fill( 0, 24, 3 ) ) ) ),
			'2026-09-15',
			$period_days
		);

		$this->assertFalse( $availability['low_traffic'], "A $period_days-day period should not have low traffic with 200 visits over the last 56 days." );
		$this->assertTrue( $availability['band_available'], "A $period_days-day period should have its band." );
	}

	public function data_period_lengths() {
		return array(
			'7 days'  => array( 7 ),
			'28 days' => array( 28 ),
			'90 days' => array( 90 ),
		);
	}

	public function test_get__has_no_low_traffic_for_a_drop_within_the_last_56_days() {
		// 300 visits over the 28 days before the period, then none at all: the
		// band should show the drop rather than give way to the notice.
		$availability = Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_rows_with_visits( '2026-09-15', array_merge( array_fill( 0, 337, 100 ), array( 300 ), array_fill( 0, 27, 0 ), array_fill( 0, 28, 0 ) ) ) ),
			'2026-09-15',
			28
		);

		$this->assertFalse( $availability['low_traffic'], 'A site with 300 visits in the 28 days before a period without visits should not have low traffic.' );
		$this->assertTrue( $availability['band_available'], 'The period should have its band, which shows the drop.' );
		$this->assertTrue( $availability['key_factors_available'], 'The period should have its key factors, which show what dropped.' );
	}

	/**
	 * @dataProvider data_short_histories
	 *
	 * @param int  $visits      The visits over the 14 days of history.
	 * @param bool $low_traffic Whether the site has low traffic.
	 */
	public function test_get__measures_a_history_shorter_than_56_days_over_its_own_days( $visits, $low_traffic ) {
		// 14 days of history, with every visit on its last day.
		$availability = Typical_Traffic_Availability::get(
			new Period_Baseline( $this->get_rows_with_visits( '2026-09-15', array_merge( array( 1 ), array_fill( 0, 12, 0 ), array( $visits - 1 ) ) ) ),
			'2026-09-15',
			7
		);

		$this->assertSame( $low_traffic, $availability['low_traffic'], "$visits visits over 14 days should have low traffic only under 50, which is 100 per 28 days." );
		$this->assertSame( ! $low_traffic, $availability['key_factors_available'], 'A 7-day period with 14 days of history should have its key factors unless the site has low traffic.' );
	}

	public function data_short_histories() {
		return array(
			'49 visits' => array( 49, true ),
			'50 visits' => array( 50, false ),
		);
	}

	/**
	 * Builds daily rows that end on a day, one for each number of visits.
	 *
	 * @param string $end_date The last day, as `YYYY-MM-DD`.
	 * @param int[]  $visits   The visits of each day, oldest first.
	 * @return array List of rows, oldest first, each with `date` and `visits`.
	 */
	private function get_rows_with_visits( $end_date, array $visits ) {
		$end   = new DateTimeImmutable( $end_date, new DateTimeZone( 'UTC' ) );
		$count = count( $visits );

		return array_map(
			fn( $position, $day_visits ) => array(
				'date'   => $end->modify( '-' . ( $count - 1 - $position ) . ' days' )->format( 'Y-m-d' ),
				'visits' => $day_visits,
			),
			array_keys( $visits ),
			$visits
		);
	}

	/**
	 * Builds daily rows for a number of days that end on a day, with visits
	 * that vary over the week, as the service's availability cases have them.
	 *
	 * @param string $end_date     The last day, as `YYYY-MM-DD`.
	 * @param int    $history_days The number of days.
	 * @return array List of rows, oldest first, each with `date` and `visits`.
	 */
	private function get_daily_rows( $end_date, $history_days ) {
		$end = new DateTimeImmutable( $end_date, new DateTimeZone( 'UTC' ) );

		return array_map(
			fn( $position ) => array(
				'date'   => $end->modify( '-' . ( $history_days - 1 - $position ) . ' days' )->format( 'Y-m-d' ),
				'visits' => 100 + $position % 7,
			),
			$history_days > 0 ? range( 0, $history_days - 1 ) : array()
		);
	}
}
