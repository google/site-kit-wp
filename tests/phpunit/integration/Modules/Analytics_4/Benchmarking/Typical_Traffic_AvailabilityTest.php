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
		// The fixture leaves out a date the site has no history for.
		$expected = array_merge(
			array(
				'band_available_from'        => null,
				'key_factors_available_from' => null,
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
