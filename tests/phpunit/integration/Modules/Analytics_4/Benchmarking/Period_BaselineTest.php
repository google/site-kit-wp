<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Period_BaselineTest
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
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Period_BaselineTest extends TestCase {

	/**
	 * The directory of the service's conformance fixtures, copied unchanged
	 * from `internal/ai/testdata/baseline_conformance` in the service.
	 */
	const FIXTURES_DIRECTORY = __DIR__ . '/fixtures/baseline-conformance';

	/**
	 * The number of conformance fixtures the service has.
	 */
	const FIXTURE_COUNT = 40;

	/**
	 * The tolerance of a model's intermediate values against a fixture.
	 */
	const TOLERANCE = 1e-6;

	/**
	 * The tolerance of a day's bounds against a fixture, which are rounded to
	 * one decimal place, so they match exactly.
	 */
	const BOUND_TOLERANCE = 1e-9;

	public function test_data_conformance_fixtures__provides_every_fixture() {
		$this->assertCount(
			self::FIXTURE_COUNT,
			$this->data_conformance_fixtures(),
			'The data provider should provide every conformance fixture of the service.'
		);
	}

	/**
	 * @dataProvider data_conformance_fixtures
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 */
	public function test_get_range__matches_the_conformance_fixture( $fixture_name ) {
		$fixture = $this->get_fixture( $fixture_name );

		$this->assertSame(
			$fixture['expected']['baseline'],
			$this->get_fixture_period_baseline( $fixture )->get_range( $fixture['target_date'], $fixture['days_in_period'] ),
			"The range of the $fixture_name fixture should be the fixture's baseline exactly."
		);
	}

	/**
	 * @dataProvider data_conformance_fixtures
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 */
	public function test_get_last_year_visits__matches_the_conformance_fixture( $fixture_name ) {
		$fixture = $this->get_fixture( $fixture_name );

		$this->assertSame(
			$fixture['expected']['last_year'],
			$this->get_fixture_period_baseline( $fixture )->get_last_year_visits( $fixture['target_date'], $fixture['days_in_period'] ),
			"Last year's visits of the $fixture_name fixture should be the fixture's exactly."
		);
	}

	/**
	 * @dataProvider data_conformance_fixtures
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 */
	public function test_get_model__matches_the_conformance_fixture( $fixture_name ) {
		$fixture  = $this->get_fixture( $fixture_name );
		$expected = $fixture['expected']['model'];
		// The fixture's model is the fit for the 28 days that end on its target
		// date, the fit each day of a range gets, whatever the range's length.
		$model = $this->get_fixture_period_baseline( $fixture )->get_model( $fixture['target_date'], 28 );

		if ( null === $expected ) {
			$this->assertNull( $model, "The $fixture_name fixture should have no model." );

			return;
		}

		$this->assertNotNull( $model, "The $fixture_name fixture should have a model." );
		$this->assertSame( array_keys( $expected ), array_keys( $model ), "The model of the $fixture_name fixture should have the fixture's keys, in the same order." );
		$this->assertSame( $expected['filtered_days'], $model['filtered_days'], "The model of the $fixture_name fixture should filter the fixture's days exactly." );

		foreach ( array( 'center', 'margin', 'block_center', 'period_weight', 'level' ) as $key ) {
			$this->assertEqualsWithDelta( $expected[ $key ], $model[ $key ], self::TOLERANCE, "The $key of the $fixture_name fixture should match the fixture." );
		}

		$list_keys = array(
			'block_totals',
			'cleaned_block_totals',
			'ratios',
			'width_ratios',
			'alignment_drifts',
			'alignment_centers',
			'alignment_margins',
			'dow_factors_sunday_first',
		);

		foreach ( $list_keys as $key ) {
			$this->assertCount( count( $expected[ $key ] ), $model[ $key ], "The $key of the $fixture_name fixture should have as many values as the fixture's." );

			foreach ( $expected[ $key ] as $index => $value ) {
				$this->assertEqualsWithDelta( $value, $model[ $key ][ $index ], self::TOLERANCE, "Value $index of the $key of the $fixture_name fixture should match the fixture." );
			}
		}
	}

	/**
	 * @dataProvider data_conformance_fixtures
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 */
	public function test_get_daily_range__matches_the_conformance_fixture( $fixture_name ) {
		$fixture     = $this->get_fixture( $fixture_name );
		$expected    = $fixture['expected']['range'];
		$daily_range = $this->get_fixture_period_baseline( $fixture )->get_daily_range( $fixture['target_date'], $fixture['days_in_period'] );

		if ( null === $expected ) {
			$this->assertNull( $daily_range, "The $fixture_name fixture should have no band." );

			return;
		}

		$this->assertNotNull( $daily_range, "The $fixture_name fixture should have a band." );
		$this->assertEqualsWithDelta( $expected['center'], $daily_range['center'], self::TOLERANCE, "The center of the total of the $fixture_name fixture should match the fixture." );
		$this->assertEqualsWithDelta( $expected['margin'], $daily_range['margin'], self::TOLERANCE, "The margin of the total of the $fixture_name fixture should match the fixture." );
		$this->assertSame( array_column( $expected['days'], 'date' ), array_column( $daily_range['days'], 'date' ), "The $fixture_name fixture should have a band for each day of its period, oldest first, ending on its target date." );

		foreach ( $expected['days'] as $index => $day ) {
			$this->assertEqualsWithDelta( $day['center'], $daily_range['days'][ $index ]['center'], self::TOLERANCE, "The center of `{$day['date']}` of the $fixture_name fixture should match the fixture." );
			$this->assertEqualsWithDelta( $day['half_width'], $daily_range['days'][ $index ]['half_width'], self::TOLERANCE, "The half-width of `{$day['date']}` of the $fixture_name fixture should match the fixture." );
			$this->assertEqualsWithDelta( $day['expected_min'], $daily_range['days'][ $index ]['expected_min'], self::BOUND_TOLERANCE, "The fewest visits of `{$day['date']}` of the $fixture_name fixture should be the fixture's exactly." );
			$this->assertEqualsWithDelta( $day['expected_max'], $daily_range['days'][ $index ]['expected_max'], self::BOUND_TOLERANCE, "The most visits of `{$day['date']}` of the $fixture_name fixture should be the fixture's exactly." );
		}
	}

	/**
	 * @dataProvider data_conformance_fixtures
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 */
	public function test_get_daily_range__adds_the_days_up_to_the_range_of_the_conformance_fixture( $fixture_name ) {
		$fixture     = $this->get_fixture( $fixture_name );
		$daily_range = $this->get_fixture_period_baseline( $fixture )->get_daily_range( $fixture['target_date'], $fixture['days_in_period'] );

		if ( null === $fixture['expected']['baseline'] ) {
			$this->assertNull( $daily_range, "The $fixture_name fixture has no range, so its days should have no band." );

			return;
		}

		// The chart and the verdict agree: the days' centers add up to the
		// total's center, their half-widths to its margin, and the range is
		// the total rounded.
		$this->assertEqualsWithDelta( $daily_range['center'], array_sum( array_column( $daily_range['days'], 'center' ) ), self::TOLERANCE, "The centers of the days of the $fixture_name fixture should add up to the center of its total." );
		$this->assertEqualsWithDelta( $daily_range['margin'], array_sum( array_column( $daily_range['days'], 'half_width' ) ), self::TOLERANCE, "The half-widths of the days of the $fixture_name fixture should add up to the margin of its total." );
		$this->assertSame(
			array(
				'expected_range_min' => (int) max( 0, round( $daily_range['center'] - $daily_range['margin'] ) ),
				'expected_range_max' => (int) round( $daily_range['center'] + $daily_range['margin'] ),
			),
			$fixture['expected']['baseline'],
			"The baseline of the $fixture_name fixture should be the total of its band, rounded."
		);
	}

	/**
	 * @dataProvider data_conformance_fixtures
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 */
	public function test_get_daily_ranges__gives_each_day_the_bounds_of_the_conformance_fixture( $fixture_name ) {
		$fixture      = $this->get_fixture( $fixture_name );
		$expected     = $fixture['expected']['range'];
		$daily_ranges = $this->get_fixture_period_baseline( $fixture )->get_daily_ranges( $fixture['target_date'], $fixture['days_in_period'] );

		if ( null === $expected ) {
			$this->assertNull( $daily_ranges, "The $fixture_name fixture has no band, so its days should have none." );

			return;
		}

		$this->assertSame( array_column( $expected['days'], 'date' ), array_keys( $daily_ranges ), "The $fixture_name fixture should have a range for each day of its period, oldest first and keyed by its date." );

		foreach ( $expected['days'] as $day ) {
			$this->assertEqualsWithDelta( $day['expected_min'], $daily_ranges[ $day['date'] ]['expected_min'], self::BOUND_TOLERANCE, "The fewest visits of `{$day['date']}` of the $fixture_name fixture should be the fixture's exactly." );
			$this->assertEqualsWithDelta( $day['expected_max'], $daily_ranges[ $day['date'] ]['expected_max'], self::BOUND_TOLERANCE, "The most visits of `{$day['date']}` of the $fixture_name fixture should be the fixture's exactly." );
		}
	}

	/**
	 * @dataProvider data_conformance_fixtures
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 */
	public function test_get_daily_range__marks_the_early_band_of_the_conformance_fixture( $fixture_name ) {
		$fixture     = $this->get_fixture( $fixture_name );
		$daily_range = $this->get_fixture_period_baseline( $fixture )->get_daily_range( $fixture['target_date'], $fixture['days_in_period'] );

		if ( null === $fixture['expected']['range'] ) {
			$this->assertNull( $daily_range, "The $fixture_name fixture should have no band." );

			return;
		}

		// The fixture's history ends on its target date, and the fit of its
		// period's first day has two blocks of reference, 56 days, from
		// `d + 83` days of history on.
		$this->assertSame(
			count( $fixture['daily_visits'] ) < $fixture['days_in_period'] + 83,
			$daily_range['early_band'],
			"The band of the $fixture_name fixture should be early only while the fit of its first day has less than two blocks of reference."
		);
	}

	public function data_conformance_fixtures() {
		$fixtures = array();

		foreach ( glob( self::FIXTURES_DIRECTORY . '/*.json' ) as $fixture_path ) {
			$fixture_name = basename( $fixture_path, '.json' );

			$fixtures[ $fixture_name ] = array( $fixture_name );
		}

		return $fixtures;
	}

	public function test_get_min_range_history_days__adds_one_block_to_the_period() {
		$this->assertSame( 35, Period_Baseline::get_min_range_history_days( 7 ), 'A 7-day fit should need 35 days of history: the period and one 28-day block.' );
		$this->assertSame( 56, Period_Baseline::get_min_range_history_days( 28 ), 'A 28-day fit should need 56 days of history: the period and one 28-day block.' );
		$this->assertSame( 118, Period_Baseline::get_min_range_history_days( 90 ), 'A 90-day fit should need 118 days of history: the period and one 28-day block.' );
		$this->assertSame( 56, Period_Baseline::get_min_range_history_days( 0 ), 'A period length that is not above 0 should be read as 28 days.' );
	}

	public function test_get_min_band_history_days__adds_55_days_to_the_period() {
		// The period's first day needs the 56 days of its own 28-day fit.
		$this->assertSame( 62, Period_Baseline::get_min_band_history_days( 7 ), 'A 7-day period should need 62 days of history for its band.' );
		$this->assertSame( 69, Period_Baseline::get_min_band_history_days( 14 ), 'A 14-day period should need 69 days of history for its band.' );
		$this->assertSame( 83, Period_Baseline::get_min_band_history_days( 28 ), 'A 28-day period should need 83 days of history for its band.' );
		$this->assertSame( 145, Period_Baseline::get_min_band_history_days( 90 ), 'A 90-day period should need 145 days of history for its band.' );
		$this->assertSame( 83, Period_Baseline::get_min_band_history_days( 0 ), 'A period length that is not above 0 should be read as 28 days.' );
	}

	public function test_get_daily_range__needs_the_band_history_up_to_the_last_day() {
		$daily_rows = $this->get_daily_rows( '2024-01-01', $this->get_daily_visits( 83 ) );

		// `2024-03-23` is day 83 of the series.
		$period_baseline = new Period_Baseline( $daily_rows );

		$this->assertNull( $period_baseline->get_daily_range( '2024-03-22', 28 ), 'A 28-day period with 82 days of history should have no band.' );
		$this->assertNull( $period_baseline->get_range( '2024-03-22', 28 ), 'A 28-day period with 82 days of history should have no range.' );
		$this->assertCount( 28, $period_baseline->get_daily_range( '2024-03-23', 28 )['days'], 'A 28-day period with 83 days of history should have a band on each of its days.' );
		$this->assertNotNull( $period_baseline->get_range( '2024-03-23', 28 ), 'A 28-day period with 83 days of history should have a range.' );
		$this->assertSame( 55, $period_baseline->get_daily_range( '2024-03-23', 28 )['reference_days'], 'The fit of the period\'s last day should be fitted on the 55 days before its own 28 days.' );
	}

	/**
	 * @dataProvider data_period_lengths
	 *
	 * @param int $period_days The period's length in days.
	 */
	public function test_get_daily_range__is_early_while_the_first_day_has_one_block_of_reference( $period_days ) {
		$band_history_days = $period_days + 55;
		$get_daily_range   = function ( $history_days ) use ( $period_days ) {
			$daily_rows = $this->get_daily_rows( '2025-01-01', $this->get_daily_visits( $history_days ) );

			return ( new Period_Baseline( $daily_rows ) )->get_daily_range( $daily_rows[ $history_days - 1 ]['date'], $period_days );
		};

		$this->assertNull( $get_daily_range( $band_history_days - 1 ), "A $period_days-day period should have no band with one day less than its $band_history_days days of history." );
		$this->assertTrue( $get_daily_range( $band_history_days )['early_band'], "A $period_days-day period should have an early band from $band_history_days days of history, when the fit of its first day has one block of reference." );
		$this->assertTrue( $get_daily_range( $period_days + 82 )['early_band'], "A $period_days-day period should still have an early band with one day less than the two blocks of reference of its first day." );
		$this->assertFalse( $get_daily_range( $period_days + 83 )['early_band'], "A $period_days-day period should have a band that is no longer early once the fit of its first day has two blocks of reference." );
	}

	public function data_period_lengths() {
		return array(
			'7 days'  => array( 7 ),
			'28 days' => array( 28 ),
			'90 days' => array( 90 ),
		);
	}

	/**
	 * @dataProvider data_band_reference_histories
	 *
	 * @param int $history_days   The days of history up to and including the period's last day.
	 * @param int $reference_days The days the fit of the period's last day should be fitted on.
	 */
	public function test_get_daily_range__returns_the_days_the_fit_of_the_last_day_is_fitted_on( $history_days, $reference_days ) {
		$daily_rows = $this->get_daily_rows( '2024-01-01', array_fill( 0, $history_days, 100 ) );

		$this->assertSame(
			$reference_days,
			( new Period_Baseline( $daily_rows ) )->get_daily_range( $daily_rows[ $history_days - 1 ]['date'], 28 )['reference_days'],
			"With $history_days days of history, the fit of a 28-day period's last day should be fitted on the days before its own 28 days, at most 365."
		);
	}

	public function data_band_reference_histories() {
		return array(
			'83 days'  => array( 83, 55 ),
			'111 days' => array( 111, 83 ),
			'200 days' => array( 200, 172 ),
			'393 days' => array( 393, 365 ),
			'700 days' => array( 700, 365 ),
		);
	}

	public function test_get_daily_range__forecasts_each_day_from_the_history_28_days_before_it() {
		$daily_visits    = $this->get_daily_visits( 420 );
		$daily_rows      = $this->get_daily_rows( '2025-01-01', $daily_visits );
		$target_date     = $daily_rows[419]['date'];
		$period_baseline = new Period_Baseline( $daily_rows );

		// The last 28 days are the period, which none of its days' fits reads.
		$changed_visits = array_merge( array_slice( $daily_visits, 0, 392 ), array_fill( 0, 28, 9999 ) );
		$changed        = new Period_Baseline( $this->get_daily_rows( '2025-01-01', $changed_visits ) );

		$this->assertSame(
			$period_baseline->get_daily_ranges( $target_date, 28 ),
			$changed->get_daily_ranges( $target_date, 28 ),
			'The visits of a 28-day period should not move the band of any of its days.'
		);
		$this->assertSame(
			$period_baseline->get_range( $target_date, 28 ),
			$changed->get_range( $target_date, 28 ),
			'The visits of a 28-day period should not move its range.'
		);

		// A day's center comes from its own fit, whatever the period it is in.
		$week  = $period_baseline->get_daily_range( $target_date, 7 )['days'];
		$month = $period_baseline->get_daily_range( $target_date, 28 )['days'];

		$this->assertSame(
			array_column( $week, 'center', 'date' ),
			array_slice( array_column( $month, 'center', 'date' ), -7, 7, true ),
			'Each day of the last week should have the same center in a 7-day period as in a 28-day one.'
		);
	}

	public function test_from_daily_series__counts_the_history_from_the_first_day_with_visits() {
		// 111 days with visits, from `2024-01-31` to `2024-05-20`, after 30 days
		// without visits.
		$recorded_rows   = $this->get_daily_rows( '2024-01-31', $this->get_daily_visits( 111 ) );
		$period_baseline = Period_Baseline::from_daily_series(
			array_merge( $this->get_daily_rows( '2024-01-01', array_fill( 0, 30, 0 ) ), $recorded_rows )
		);

		$this->assertSame( 111, $period_baseline->get_history_days( '2024-05-20' ), 'The history should count from `2024-01-31`, the first day with visits, rather than from `2024-01-01`, the first day of the series.' );
		$this->assertNotNull( $period_baseline->get_range( '2024-05-20', 28 ), 'The 111 days with visits should give a 28-day period a range.' );
		$this->assertSame(
			( new Period_Baseline( $recorded_rows ) )->get_range( '2024-05-20', 28 ),
			$period_baseline->get_range( '2024-05-20', 28 ),
			'The range should be fitted as if the series started on its first day with visits.'
		);
	}

	public function test_from_daily_series__has_no_history_without_a_day_with_visits() {
		$period_baseline = Period_Baseline::from_daily_series( $this->get_daily_rows( '2024-01-01', array_fill( 0, 120, 0 ) ) );

		$this->assertSame( 0, $period_baseline->get_history_days( '2024-04-29' ), 'A series without a day with visits should have no history.' );
		$this->assertNull( $period_baseline->get_range( '2024-04-29', 28 ), 'A series without a day with visits should have no range.' );
		$this->assertNull( $period_baseline->get_daily_ranges( '2024-04-29', 28 ), 'A series without a day with visits should have no range for any day.' );
	}

	public function test_get_history_days__counts_the_days_from_the_earliest_row_to_the_day() {
		$period_baseline = new Period_Baseline( $this->get_daily_rows( '2024-01-01', $this->get_daily_visits( 120 ) ) );

		$this->assertSame( 1, $period_baseline->get_history_days( '2024-01-01' ), 'The earliest row\'s own day should count as one day of history.' );
		$this->assertSame( 120, $period_baseline->get_history_days( '2024-04-29' ), 'The last row\'s day should count every day from the earliest row on.' );
		$this->assertSame( 0, $period_baseline->get_history_days( '2023-12-31' ), 'A day before the earliest row should have no history.' );
	}

	public function test_get_recent_visits__adds_up_the_last_days_up_to_the_day() {
		// One visit on `2024-01-01`, two on `2024-01-02`, and so on.
		$period_baseline = new Period_Baseline( $this->get_daily_rows( '2024-01-01', range( 1, 10 ) ) );

		$this->assertSame(
			array(
				'visits' => 8 + 9 + 10,
				'days'   => 3,
			),
			$period_baseline->get_recent_visits( '2024-01-10', 3 ),
			'The visits should be those of the three days that end on `2024-01-10`.'
		);
		$this->assertSame(
			array(
				'visits' => 4 + 5,
				'days'   => 2,
			),
			$period_baseline->get_recent_visits( '2024-01-05', 2 ),
			'The days after the target day should not count.'
		);
	}

	public function test_get_recent_visits__reads_a_shorter_history_over_its_own_days() {
		$period_baseline = new Period_Baseline( $this->get_daily_rows( '2024-01-01', range( 1, 10 ) ) );

		$this->assertSame(
			array(
				'visits' => 55,
				'days'   => 10,
			),
			$period_baseline->get_recent_visits( '2024-01-10', 56 ),
			'The window should be cut to the 10 days from the earliest row on.'
		);
		$this->assertNull( $period_baseline->get_recent_visits( '2023-12-31', 56 ), 'A day before the earliest row should have no visits to read.' );
	}

	public function test_get_recent_visits__reads_a_day_without_a_row_as_zero() {
		$period_baseline = new Period_Baseline(
			array(
				array(
					'date'   => '2024-01-01',
					'visits' => 5,
				),
				array(
					'date'   => '2024-01-04',
					'visits' => 7,
				),
			)
		);

		$this->assertSame(
			array(
				'visits' => 12,
				'days'   => 4,
			),
			$period_baseline->get_recent_visits( '2024-01-04', 56 ),
			'The two days without a row should count as days without visits.'
		);
	}

	public function test_get_range__floors_the_range_of_a_history_without_visits() {
		$daily_rows      = $this->get_daily_rows( '2025-01-01', array_fill( 0, 400, 0 ) );
		$target_date     = $daily_rows[399]['date'];
		$period_baseline = new Period_Baseline( $daily_rows );
		$model           = $period_baseline->get_model( $target_date, 28 );

		$this->assertNotNull( $model, 'A history of 400 days without visits should have a model.' );
		$this->assertSame( array(), $model['ratios'], 'A level of 0 should skip every miss, rather than divide by it.' );
		$this->assertSame( array(), $model['width_ratios'], 'A forecast of 0 should skip every width miss, rather than divide by it.' );
		$this->assertEquals( array( 1.0, 1.0, 1.0, 1.0 ), $model['alignment_drifts'], 'Without a miss, no alignment should drift.' );
		$this->assertEquals( array_fill( 0, 7, 1.0 ), $model['dow_factors_sunday_first'], 'Without visits, every weekday should have a factor of 1.' );
		$this->assertEquals( 10.0, $model['block_center'], 'The block center should not go below 10.' );
		// The service's own test of the same series expects 0 to 34: the
		// center of 10, and a margin of about 24.2 around it.
		$this->assertSame(
			array(
				'expected_range_min' => 0,
				'expected_range_max' => 34,
			),
			$period_baseline->get_range( $target_date, 28 ),
			'The range of a history without visits should start at 0, not below it, and end at 34.'
		);
	}

	public function test_get_model__keeps_the_last_row_of_a_duplicated_date() {
		$daily_rows    = $this->get_daily_rows( '2025-01-01', $this->get_daily_visits( 120 ) );
		$target_date   = $daily_rows[119]['date'];
		$duplicate_row = array(
			'date'   => $daily_rows[80]['date'],
			'visits' => 1000,
		);

		$replaced_rows               = $daily_rows;
		$replaced_rows[80]['visits'] = 1000;

		$model          = ( new Period_Baseline( $daily_rows ) )->get_model( $target_date, 28 );
		$replaced_model = ( new Period_Baseline( $replaced_rows ) )->get_model( $target_date, 28 );

		$this->assertNotSame( $model, $replaced_model, 'The visits of a reference day should change the model.' );
		$this->assertSame(
			$replaced_model,
			( new Period_Baseline( array_merge( $daily_rows, array( $duplicate_row ) ) ) )->get_model( $target_date, 28 ),
			'A date with a later row should have the visits of the later row.'
		);
		$this->assertSame(
			$model,
			( new Period_Baseline( array_merge( array( $duplicate_row ), $daily_rows ) ) )->get_model( $target_date, 28 ),
			'A date with an earlier row should not have the visits of the earlier row.'
		);
	}

	public function test_get_model__ignores_rows_after_the_target_date() {
		$daily_rows        = $this->get_daily_rows( '2025-01-01', $this->get_daily_visits( 120 ) );
		$later_rows        = $this->get_daily_rows( '2025-05-01', array_fill( 0, 30, 100000 ) );
		$target_date       = $daily_rows[119]['date'];
		$period_baseline   = new Period_Baseline( $daily_rows );
		$with_later_rows   = new Period_Baseline( array_merge( $daily_rows, $later_rows ) );
		$expected_model    = $period_baseline->get_model( $target_date, 28 );
		$model_after_later = $with_later_rows->get_model( $target_date, 28 );

		$this->assertNotNull( $expected_model, 'A 28-day period with 120 days of history should have a model.' );
		$this->assertSame( $expected_model, $model_after_later, 'Rows after the target date should not change the model.' );
		$this->assertSame( $period_baseline->get_range( $target_date, 28 ), $with_later_rows->get_range( $target_date, 28 ), 'Rows after the target date should not change the range.' );
	}

	public function test_get_model__reads_a_day_without_a_row_as_zero() {
		$daily_rows              = $this->get_daily_rows( '2025-01-01', $this->get_daily_visits( 120 ) );
		$target_date             = $daily_rows[119]['date'];
		$zero_rows               = $daily_rows;
		$zero_rows[80]['visits'] = 0;
		$missing_rows            = $daily_rows;

		unset( $missing_rows[80] );

		$this->assertSame(
			( new Period_Baseline( $zero_rows ) )->get_model( $target_date, 28 ),
			( new Period_Baseline( $missing_rows ) )->get_model( $target_date, 28 ),
			'A day without a row should count as a day with 0 visits.'
		);

		// The last row is on 2025-04-30, a week before the target date.
		$this->assertSame(
			( new Period_Baseline( array_merge( $daily_rows, $this->get_daily_rows( '2025-05-01', array_fill( 0, 7, 0 ) ) ) ) )->get_model( '2025-05-07', 28 ),
			( new Period_Baseline( $daily_rows ) )->get_model( '2025-05-07', 28 ),
			'The days between the last row and the target date should count as days with 0 visits.'
		);
	}

	public function test_get_model__ignores_a_row_with_an_invalid_date() {
		$daily_rows   = $this->get_daily_rows( '2025-01-01', $this->get_daily_visits( 120 ) );
		$target_date  = $daily_rows[119]['date'];
		$invalid_rows = array_map(
			fn( $date ) => array(
				'date'   => $date,
				'visits' => 5000,
			),
			array( '2024-02-30', '2024-12-1', '2024-12-01 00:00:00' )
		);

		$this->assertSame(
			( new Period_Baseline( $daily_rows ) )->get_model( $target_date, 28 ),
			( new Period_Baseline( array_merge( $invalid_rows, $daily_rows ) ) )->get_model( $target_date, 28 ),
			'A row whose date is not a valid `YYYY-MM-DD` date should be ignored.'
		);
	}

	public function test_get_last_year_visits__returns_null_when_a_day_of_a_window_has_no_row() {
		$daily_visits    = $this->get_daily_visits( 450 );
		$daily_rows      = $this->get_daily_rows( '2024-03-04', $daily_visits );
		$target_date     = $daily_rows[449]['date'];
		$current_period  = array_sum( array_slice( $daily_visits, 58, 28 ) );
		$previous_period = array_sum( array_slice( $daily_visits, 30, 28 ) );

		// 364 days before the 28-day period that ends on day 449, the current
		// window is days 58 to 85 of the series and the previous window is
		// days 30 to 57.
		$this->assertSame(
			array(
				'current_period'  => $current_period,
				'previous_period' => $previous_period,
			),
			( new Period_Baseline( $daily_rows ) )->get_last_year_visits( $target_date, 28 ),
			"Last year's visits should be the totals of the two windows 364 days back."
		);

		foreach ( array( 30, 57, 58, 85 ) as $missing_day ) {
			$rows = $daily_rows;
			unset( $rows[ $missing_day ] );

			$this->assertNull(
				( new Period_Baseline( $rows ) )->get_last_year_visits( $target_date, 28 ),
				"Last year's visits should be null when day $missing_day, in one of the windows, has no row."
			);
		}

		foreach ( array( 29, 86 ) as $missing_day ) {
			$rows = $daily_rows;
			unset( $rows[ $missing_day ] );

			$this->assertNotNull(
				( new Period_Baseline( $rows ) )->get_last_year_visits( $target_date, 28 ),
				"Last year's visits should not need a row for day $missing_day, outside both windows."
			);
		}

		$zero_rows               = $daily_rows;
		$zero_rows[70]['visits'] = 0;

		$this->assertSame(
			array(
				'current_period'  => $current_period - $daily_visits[70],
				'previous_period' => $previous_period,
			),
			( new Period_Baseline( $zero_rows ) )->get_last_year_visits( $target_date, 28 ),
			"A day of a window with a row of 0 visits should count as 0 in last year's visits."
		);
	}

	public function test_get_in_period_spike__finds_a_brief_spike_that_carried_most_of_the_gain() {
		// 28 days of 90 visits from `2026-05-01`, but 500 on `2026-05-20` and
		// 400 on `2026-05-21`: 3,240 visits, 720 more than the period before.
		// Without a band, each day's bound is the range's 2,800 visits over the
		// 28 days, 100, so the two days had 700 visits above their bounds,
		// 97.2% of the gain.
		$this->assertSame(
			array(
				'peak_date'         => '2026-05-20',
				'start_date'        => '2026-05-20',
				'end_date'          => '2026-05-21',
				'days'              => 2,
				'share_of_gain_pct' => 97.2,
			),
			$this->get_brief_spike_period_baseline()->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 720 ),
			'The two days above their bounds, which carried 97.2% of the gain, should be the spike.'
		);
	}

	public function test_get_in_period_spike__finds_no_spike_in_a_run_of_more_than_3_days() {
		// Five days of 300 visits in a row, from `2026-05-11`, are a sustained
		// rise rather than a brief spike.
		$daily_visits = array_replace( array_fill( 0, 28, 90 ), array_fill( 10, 5, 300 ) );

		$this->assertNull(
			( new Period_Baseline( $this->get_daily_rows( '2026-05-01', $daily_visits ) ) )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 1000 ),
			'Five days in a row above their bounds should not be a brief spike.'
		);
	}

	public function test_get_in_period_spike__does_not_join_days_that_do_not_follow_each_other() {
		// Days of 350 visits, each 250 above its bound of 100, which is 25% of
		// the gain of 1,000, and no row for any other day.
		$get_period_baseline = fn( ...$dates ) => new Period_Baseline(
			array_map(
				fn( $date ) => array(
					'date'   => $date,
					'visits' => 350,
				),
				$dates
			)
		);

		$this->assertNull(
			$get_period_baseline( '2026-05-05', '2026-05-20' )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 1000 ),
			'Two days 15 days apart should not be joined into a run, though no day between them has a row.'
		);
		$this->assertSame(
			array(
				'peak_date'         => '2026-05-19',
				'start_date'        => '2026-05-19',
				'end_date'          => '2026-05-20',
				'days'              => 2,
				'share_of_gain_pct' => 50.0,
			),
			$get_period_baseline( '2026-05-19', '2026-05-20' )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 1000 ),
			'Two days in a row, which carried half the gain together, should be a spike.'
		);
	}

	public function test_get_in_period_spike__finds_no_spike_in_a_steady_period_with_a_tiny_gain() {
		// 28 days of 100 visits, but 160 on `2026-05-11`, 40 above its bound of
		// 120: 89% of a gain of 45 visits, 1.6%, but 1.4% of the period's
		// 2,860 visits.
		$daily_visits     = array_fill( 0, 28, 100 );
		$daily_visits[10] = 160;

		$this->assertNull(
			( new Period_Baseline( $this->get_daily_rows( '2026-05-01', $daily_visits ) ) )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2200, 3360 ), 45 ),
			'A day above its bound should not be a spike in a period whose visits did not rise, for less than 5% of the period\'s visits.'
		);
	}

	public function test_get_in_period_spike__finds_no_spike_in_the_weekly_cycle_of_the_band() {
		// 120 days from `2026-01-29`, with 140 visits on a weekday and 30 on a
		// weekend day, but 155 on each weekday of the last 28 days: above the
		// period's even share of its range, 3,852 visits over 28 days, but
		// within the band of each weekday.
		$period_baseline = new Period_Baseline(
			$this->get_dated_rows(
				'2026-01-29',
				120,
				function ( $date ) {
					if ( $this->is_weekend( $date ) ) {
						return 30;
					}

					return $date >= '2026-05-01' ? 155 : 140;
				}
			)
		);

		$this->assertNull(
			$period_baseline->get_in_period_spike( '2026-05-28', 28, $period_baseline->get_range( '2026-05-28', 28 ), 300 ),
			'The usual weekdays of a site with fewer visits on a weekend should not be a spike.'
		);
	}

	public function test_get_in_period_spike__finds_a_spike_above_the_band_of_its_weekday() {
		// 400 days with 160 visits on a weekday and 40 on a weekend day, but 150
		// on each day of the weekend of `2026-08-29`: 3,740 visits in the 28
		// days to `2026-09-15`, 220 more than the period before. The band of
		// each weekend day reaches 56.1 visits, so the two days had 187.8 visits
		// above their bounds, 85.4% of the gain.
		$daily_rows      = $this->get_dated_rows(
			'2025-08-12',
			400,
			function ( $date ) {
				if ( in_array( $date, array( '2026-08-29', '2026-08-30' ), true ) ) {
					return 150;
				}

				return $this->is_weekend( $date ) ? 40 : 160;
			}
		);
		$period_baseline = new Period_Baseline( $daily_rows );
		$range           = $period_baseline->get_range( '2026-09-15', 28 );

		$this->assertSame(
			array(
				'peak_date'         => '2026-08-29',
				'start_date'        => '2026-08-29',
				'end_date'          => '2026-08-30',
				'days'              => 2,
				'share_of_gain_pct' => 85.4,
			),
			$period_baseline->get_in_period_spike( '2026-09-15', 28, $range, 220 ),
			'The two weekend days above the band of their weekday should be the spike.'
		);

		// With the last 56 days of history alone, the period has no band, and
		// each day's bound is the period's even share of the same range, 4,071
		// visits over 28 days, which the two days were 9.2 visits above.
		$this->assertNull(
			( new Period_Baseline( array_slice( $daily_rows, -56 ) ) )->get_in_period_spike( '2026-09-15', 28, $range, 220 ),
			'Without a band, the two weekend days should be measured against the period\'s even share of its range.'
		);
	}

	public function test_get_in_period_spike__finds_no_spike_in_a_period_above_its_range_throughout() {
		// 28 days of 120 visits, but 95 on every fourth day and 200 on
		// `2026-05-16`: 3,265 visits, 465 above the range. The run from
		// `2026-05-14` to `2026-05-16` had 140 visits above its bounds of 100,
		// 56% of the gain of 250, but less than 40% of the 465.
		$daily_visits     = array_map( fn( $day ) => 0 === $day % 4 ? 95 : 120, range( 0, 27 ) );
		$daily_visits[15] = 200;

		$this->assertNull(
			( new Period_Baseline( $this->get_daily_rows( '2026-05-01', $daily_visits ) ) )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 250 ),
			'A run should not be a spike of a period above its range for less than 40% of the visits above the range.'
		);
	}

	public function test_get_in_period_spike__keeps_the_run_with_the_largest_excess() {
		// 28 days of 90 visits, but 500 on `2026-05-05` and 600 on `2026-05-20`:
		// 400 and 500 visits above the bound of 100, 44% and 56% of the gain of
		// 900.
		$daily_visits     = array_fill( 0, 28, 90 );
		$daily_visits[4]  = 500;
		$daily_visits[19] = 600;

		$this->assertSame(
			array(
				'peak_date'         => '2026-05-20',
				'start_date'        => '2026-05-20',
				'end_date'          => '2026-05-20',
				'days'              => 1,
				'share_of_gain_pct' => 55.6,
			),
			( new Period_Baseline( $this->get_daily_rows( '2026-05-01', $daily_visits ) ) )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 900 ),
			'Of two runs that are each a spike, the one with the most visits above its bounds should be the spike.'
		);

		$daily_visits[19] = 500;

		$this->assertSame(
			'2026-05-05',
			( new Period_Baseline( $this->get_daily_rows( '2026-05-01', $daily_visits ) ) )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 800 )['start_date'],
			'Of two runs with as many visits above their bounds, the earlier should be the spike.'
		);
	}

	public function test_get_in_period_spike__names_the_first_day_with_the_most_visits_as_its_peak() {
		// 300, 500 and 500 visits from `2026-05-10`: 1,000 above the bound of
		// 100, 83.3% of the gain of 1,200.
		$daily_visits = array_replace(
			array_fill( 0, 28, 90 ),
			array(
				9  => 300,
				10 => 500,
				11 => 500,
			)
		);

		$this->assertSame(
			array(
				'peak_date'         => '2026-05-11',
				'start_date'        => '2026-05-10',
				'end_date'          => '2026-05-12',
				'days'              => 3,
				'share_of_gain_pct' => 83.3,
			),
			( new Period_Baseline( $this->get_daily_rows( '2026-05-01', $daily_visits ) ) )->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 1200 ),
			'The peak should be the first of the run\'s days with the most visits.'
		);
	}

	public function test_get_in_period_spike__caps_the_share_of_the_gain_at_100() {
		// The two days of the brief spike had 700 visits above their bounds,
		// more than a gain of 500.
		$this->assertSame(
			100.0,
			$this->get_brief_spike_period_baseline()->get_in_period_spike( '2026-05-28', 28, $this->get_expected_range( 2000, 2800 ), 500 )['share_of_gain_pct'],
			'The share of the gain should be at most 100%, which the service checks.'
		);
	}

	/**
	 * @dataProvider data_ranges_and_gains_without_a_spike
	 *
	 * @param array $range        The expected range of the period's visits total.
	 * @param int   $period_delta The period's gain.
	 */
	public function test_get_in_period_spike__needs_a_range_and_a_gain( array $range, $period_delta ) {
		$this->assertNull(
			$this->get_brief_spike_period_baseline()->get_in_period_spike( '2026-05-28', 28, $range, $period_delta ),
			'A period should have no spike without both bounds of a range, the most visits of the range above 0, or a gain.'
		);
	}

	public function data_ranges_and_gains_without_a_spike() {
		$range = array(
			'expected_range_min' => 2000,
			'expected_range_max' => 2800,
		);

		return array(
			'no range'                    => array( array(), 720 ),
			'a range without its minimum' => array( array( 'expected_range_max' => 2800 ), 720 ),
			'a range with a maximum of 0' => array(
				array(
					'expected_range_min' => 0,
					'expected_range_max' => 0,
				),
				720,
			),
			'no change'                   => array( $range, 0 ),
			'a drop'                      => array( $range, -720 ),
		);
	}

	/**
	 * Builds the model of the 28 days of the brief spike, from `2026-05-01`
	 * to `2026-05-28`: 90 visits a day, but 500 on `2026-05-20` and 400 on
	 * `2026-05-21`.
	 *
	 * @return Period_Baseline The model of the days.
	 */
	private function get_brief_spike_period_baseline() {
		$daily_visits     = array_fill( 0, 28, 90 );
		$daily_visits[19] = 500;
		$daily_visits[20] = 400;

		return new Period_Baseline( $this->get_daily_rows( '2026-05-01', $daily_visits ) );
	}

	/**
	 * Builds the expected range of a period's visits total, as
	 * `Period_Baseline::get_range()` returns it.
	 *
	 * @param int $expected_range_min The fewest visits of the range.
	 * @param int $expected_range_max The most visits of the range.
	 * @return array The range.
	 */
	private function get_expected_range( $expected_range_min, $expected_range_max ) {
		return array(
			'expected_range_min' => $expected_range_min,
			'expected_range_max' => $expected_range_max,
		);
	}

	/**
	 * Builds daily rows for a number of days from a day on, with the visits of
	 * each day from its date.
	 *
	 * @param string   $start_date The first day, as `YYYY-MM-DD`.
	 * @param int      $days       The number of days.
	 * @param callable $get_visits Gets the visits of a day from its date, as `YYYY-MM-DD`.
	 * @return array List of rows, each with `date` and `visits`.
	 */
	private function get_dated_rows( $start_date, $days, callable $get_visits ) {
		return array_map(
			fn( $row ) => array(
				'date'   => $row['date'],
				'visits' => $get_visits( $row['date'] ),
			),
			$this->get_daily_rows( $start_date, array_fill( 0, $days, 0 ) )
		);
	}

	/**
	 * Checks whether a day is on a weekend.
	 *
	 * @param string $date The day, as `YYYY-MM-DD`.
	 * @return bool True when the day is a Saturday or a Sunday, false otherwise.
	 */
	private function is_weekend( $date ) {
		return in_array( ( new DateTimeImmutable( $date, new DateTimeZone( 'UTC' ) ) )->format( 'w' ), array( '0', '6' ), true );
	}

	/**
	 * Reads a conformance fixture.
	 *
	 * @param string $fixture_name The fixture's name, the base name of its file.
	 * @return array The fixture.
	 */
	private function get_fixture( $fixture_name ) {
		return json_decode( file_get_contents( self::FIXTURES_DIRECTORY . '/' . $fixture_name . '.json' ), true );
	}

	/**
	 * Builds the period baseline of a conformance fixture's daily series.
	 *
	 * @param array $fixture The fixture, with its `start_date` and `daily_visits`.
	 * @return Period_Baseline The period baseline.
	 */
	private function get_fixture_period_baseline( array $fixture ) {
		return new Period_Baseline( $this->get_daily_rows( $fixture['start_date'], $fixture['daily_visits'] ) );
	}

	/**
	 * Builds the visits of a series of days, which vary from day to day.
	 *
	 * @param int $days The number of days.
	 * @return int[] The visits of each day, oldest first.
	 */
	private function get_daily_visits( $days ) {
		return array_map(
			fn( $day ) => 200 + ( $day * 37 ) % 151,
			range( 0, $days - 1 )
		);
	}

	/**
	 * Builds daily rows, one row for each count, from a day on.
	 *
	 * @param string $start_date   The first day, as `YYYY-MM-DD`.
	 * @param int[]  $daily_visits The visits of each day, oldest first.
	 * @return array List of rows, each with `date` and `visits`.
	 */
	private function get_daily_rows( $start_date, array $daily_visits ) {
		$date       = new DateTimeImmutable( $start_date, new DateTimeZone( 'UTC' ) );
		$daily_rows = array();

		foreach ( $daily_visits as $visits ) {
			$daily_rows[] = array(
				'date'   => $date->format( 'Y-m-d' ),
				'visits' => $visits,
			);

			$date = $date->modify( '+1 day' );
		}

		return $daily_rows;
	}
}
