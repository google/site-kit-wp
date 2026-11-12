<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Expected_BaselineTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use DateTimeImmutable;
use DateTimeZone;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Expected_Baseline;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Expected_BaselineTest extends TestCase {

	public function test_get_fit__gives_a_steady_year_a_range_around_its_level() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( array_fill( 0, 365, 100 ) ) );

		$fit = $expected_baseline->get_fit( 364 );

		$this->assertSame( 77.6, $fit['expectedMin'], 'A year at 100 visits a day should give the last day 77.6 as its fewest normal visits.' );
		$this->assertSame( 122.4, $fit['expectedMax'], 'A year at 100 visits a day should give the last day 122.4 as its most normal visits.' );
		$this->assertEqualsWithDelta( 0, $fit['monthlyTrendPercent'], 0.0001, 'A year at 100 visits a day should have no monthly trend.' );
		$this->assertSame( Expected_Baseline::DIRECTION_STABLE, $fit['trendDirection'], 'A year at 100 visits a day should have a stable trend.' );
	}

	public function test_get_fit__gives_a_small_site_a_wider_range_relative_to_its_level() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( array_fill( 0, 365, 10 ) ) );

		$fit = $expected_baseline->get_fit( 364 );

		$this->assertSame( 5.7, $fit['expectedMin'], 'A year at 10 visits a day should give the last day 5.7 as its fewest normal visits.' );
		$this->assertSame( 14.3, $fit['expectedMax'], 'A year at 10 visits a day should give the last day 14.3 as its most normal visits.' );
	}

	public function test_get_fit__gives_the_28th_day_of_history_the_wider_range_of_a_short_history() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( array_fill( 0, 28, 100 ) ) );

		$fit = $expected_baseline->get_fit( 27 );

		$this->assertSame( 69.7, $fit['expectedMin'], '28 days at 100 visits should give the last day 69.7 as its fewest normal visits.' );
		$this->assertSame( 130.3, $fit['expectedMax'], '28 days at 100 visits should give the last day 130.3 as its most normal visits.' );
		$this->assertEqualsWithDelta( 0, $fit['monthlyTrendPercent'], 0.0001, '28 days have too few totals for a monthly trend.' );
		$this->assertSame( Expected_Baseline::DIRECTION_STABLE, $fit['trendDirection'], '28 days have too few totals for a trend that is not stable.' );
	}

	public function test_get_fit__gives_no_range_to_a_day_with_fewer_than_28_days_of_history() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( array_fill( 0, 27, 100 ) ) );

		$this->assertSame(
			array(
				'expectedMin'         => null,
				'expectedMax'         => null,
				'monthlyTrendPercent' => null,
				'trendDirection'      => null,
			),
			$expected_baseline->get_fit( 26 ),
			'A day with 27 days of history should have no range and no trend.'
		);
	}

	public function test_get_fit__counts_history_from_the_first_day_with_visits() {
		$expected_baseline = new Expected_Baseline(
			$this->get_daily_series( array_merge( array_fill( 0, 100, 0 ), array_fill( 0, 365, 100 ) ) )
		);

		// The first day with visits is at position 100, so its 27th day is at
		// position 126 and its 28th at position 127.
		$this->assertNull( $expected_baseline->get_fit( 126 )['expectedMin'], 'The 27th day with visits should have no fewest normal visits.' );
		$this->assertNull( $expected_baseline->get_fit( 126 )['expectedMax'], 'The 27th day with visits should have no most normal visits.' );

		$this->assertSame( 69.7, $expected_baseline->get_fit( 127 )['expectedMin'], 'The 28th day with visits should have 69.7 as its fewest normal visits.' );
		$this->assertSame( 130.3, $expected_baseline->get_fit( 127 )['expectedMax'], 'The 28th day with visits should have 130.3 as its most normal visits.' );

		$this->assertSame( 77.6, $expected_baseline->get_fit( 464 )['expectedMin'], 'The last day should have the fewest normal visits of a year at 100 visits a day.' );
		$this->assertSame( 122.4, $expected_baseline->get_fit( 464 )['expectedMax'], 'The last day should have the most normal visits of a year at 100 visits a day.' );
	}

	public function test_get_fit__reads_no_day_more_than_364_days_before_the_day() {
		$expected_baseline = new Expected_Baseline(
			$this->get_daily_series( array_merge( array_fill( 0, 35, 1000 ), array_fill( 0, 365, 100 ) ) )
		);

		$fit = $expected_baseline->get_fit( 399 );

		$this->assertSame( 77.6, $fit['expectedMin'], 'The 35 days at 1000 visits, more than 364 days before the last day, should not move its fewest normal visits.' );
		$this->assertSame( 122.4, $fit['expectedMax'], 'The 35 days at 1000 visits, more than 364 days before the last day, should not move its most normal visits.' );
	}

	public function test_get_fit__gives_a_rising_year_an_upward_trend() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( range( 100, 464 ) ) );

		$fit = $expected_baseline->get_fit( 364 );

		$this->assertEqualsWithDelta( 7.4938, $fit['monthlyTrendPercent'], 0.0001, 'A year rising by one visit a day should have a monthly trend of about 7.49%.' );
		$this->assertSame( Expected_Baseline::DIRECTION_UP, $fit['trendDirection'], 'A year rising by one visit a day should have an upward trend.' );
	}

	public function test_get_fit__gives_a_falling_year_a_downward_trend() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( range( 464, 100 ) ) );

		$fit = $expected_baseline->get_fit( 364 );

		$this->assertEqualsWithDelta( -17.3329, $fit['monthlyTrendPercent'], 0.0001, 'A year falling by one visit a day should have a monthly trend of about -17.33%.' );
		$this->assertSame( Expected_Baseline::DIRECTION_DOWN, $fit['trendDirection'], 'A year falling by one visit a day should have a downward trend.' );
	}

	public function test_get_fit__gives_no_range_to_any_day_of_a_series_with_no_visits() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( array_fill( 0, 400, 0 ) ) );

		foreach ( range( 0, 399 ) as $day_index ) {
			$fit = $expected_baseline->get_fit( $day_index );

			$this->assertNull( $fit['expectedMin'], "Day $day_index of a series with no visits should have no fewest normal visits." );
			$this->assertNull( $fit['expectedMax'], "Day $day_index of a series with no visits should have no most normal visits." );
		}
	}

	public function test_get_fit__gives_no_range_to_a_position_outside_the_series() {
		$expected_baseline = new Expected_Baseline( $this->get_daily_series( array_fill( 0, 365, 100 ) ) );

		$this->assertNull( $expected_baseline->get_fit( 365 )['expectedMin'], 'A position after the last day should have no fewest normal visits.' );
		$this->assertNull( $expected_baseline->get_fit( -1 )['expectedMax'], 'A position before the first day should have no most normal visits.' );
	}

	/**
	 * @dataProvider data_unusual_days
	 *
	 * @param int $unusual_visits The visits of the unusual day.
	 * @param int $limited_visits The visits the unusual day is limited to.
	 */
	public function test_get_fit__limits_an_unusual_day( $unusual_visits, $limited_visits ) {
		$unusual_series            = array_fill( 0, 365, 100 );
		$unusual_series[182]       = $unusual_visits;
		$limited_series            = array_fill( 0, 365, 100 );
		$limited_series[182]       = $limited_visits;
		$unusual_expected_baseline = new Expected_Baseline( $this->get_daily_series( $unusual_series ) );
		$limited_expected_baseline = new Expected_Baseline( $this->get_daily_series( $limited_series ) );

		foreach ( range( 0, 364 ) as $day_index ) {
			$this->assertSame(
				$limited_expected_baseline->get_fit( $day_index ),
				$unusual_expected_baseline->get_fit( $day_index ),
				"Day $day_index should have the same results with $unusual_visits visits in the middle of the year as with $limited_visits."
			);
		}
	}

	public function data_unusual_days() {
		// With 100 visits on almost every day, the quartiles are both 100 and the
		// interquartile range is its minimum of 10, so a day is limited to 75 to
		// 125 visits.
		return array(
			'a viral day'       => array( 5000, 125 ),
			'a tracking outage' => array( 0, 75 ),
		);
	}

	public function test_get_fit__does_not_change_an_earlier_day_when_a_later_day_changes() {
		$daily_visits = array_map(
			fn( $day ) => 200 + ( $day * 37 ) % 151,
			range( 0, 399 )
		);

		$changed_daily_visits      = $daily_visits;
		$changed_daily_visits[399] = 9999;
		$expected_baseline         = new Expected_Baseline( $this->get_daily_series( $daily_visits ) );
		$changed_expected_baseline = new Expected_Baseline( $this->get_daily_series( $changed_daily_visits ) );

		$this->assertNotSame(
			$expected_baseline->get_fit( 399 ),
			$changed_expected_baseline->get_fit( 399 ),
			'The changed day should have results of its own.'
		);

		foreach ( range( 0, 398 ) as $day_index ) {
			$this->assertSame(
				$expected_baseline->get_fit( $day_index ),
				$changed_expected_baseline->get_fit( $day_index ),
				"Day $day_index should have the same results whatever the visits on the last day."
			);
		}
	}

	public function test_get_fit__shapes_the_range_by_weekday() {
		$daily_series = $this->get_daily_series( array_fill( 0, 365, 0 ) );

		foreach ( $daily_series as $position => $day ) {
			$daily_series[ $position ]['visits'] = $this->is_weekend( $day['date'] ) ? 50 : 120;
		}

		$expected_baseline = new Expected_Baseline( $daily_series );
		$weekday_minimums  = array();
		$weekend_maximums  = array();

		foreach ( range( 358, 364 ) as $day_index ) {
			$fit = $expected_baseline->get_fit( $day_index );

			if ( $this->is_weekend( $daily_series[ $day_index ]['date'] ) ) {
				$weekend_maximums[] = $fit['expectedMax'];
			} else {
				$weekday_minimums[] = $fit['expectedMin'];
			}
		}

		$this->assertCount( 5, $weekday_minimums, 'The last week should have five weekdays.' );
		$this->assertCount( 2, $weekend_maximums, 'The last week should have two weekend days.' );
		$this->assertGreaterThan(
			max( $weekend_maximums ),
			min( $weekday_minimums ),
			'Every weekday of the last week should have a range above the range of every weekend day.'
		);
	}

	/**
	 * Builds a daily series, one day for each count, from `2025-01-01` on.
	 *
	 * @param int[] $daily_visits The visits of each day, oldest first.
	 * @return array List of days, each with `date` and `visits`.
	 */
	private function get_daily_series( array $daily_visits ) {
		$date         = new DateTimeImmutable( '2025-01-01', new DateTimeZone( 'UTC' ) );
		$daily_series = array();

		foreach ( $daily_visits as $visits ) {
			$daily_series[] = array(
				'date'   => $date->format( 'Y-m-d' ),
				'visits' => $visits,
			);

			$date = $date->modify( '+1 day' );
		}

		return $daily_series;
	}

	/**
	 * Checks whether a day is a Saturday or a Sunday.
	 *
	 * @param string $date The day, as `YYYY-MM-DD`.
	 * @return bool True for a Saturday or a Sunday, false otherwise.
	 */
	private function is_weekend( $date ) {
		return in_array( ( new DateTimeImmutable( $date, new DateTimeZone( 'UTC' ) ) )->format( 'w' ), array( '0', '6' ), true );
	}
}
