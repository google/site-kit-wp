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
	const FIXTURE_COUNT = 31;

	/**
	 * The tolerance of a model's intermediate values against a fixture.
	 */
	const TOLERANCE = 1e-6;

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
		$model    = $this->get_fixture_period_baseline( $fixture )->get_model( $fixture['target_date'], $fixture['days_in_period'] );

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

	public function data_conformance_fixtures() {
		$fixtures = array();

		foreach ( glob( self::FIXTURES_DIRECTORY . '/*.json' ) as $fixture_path ) {
			$fixture_name = basename( $fixture_path, '.json' );

			$fixtures[ $fixture_name ] = array( $fixture_name );
		}

		return $fixtures;
	}

	public function test_get_min_range_history_days__adds_two_blocks_to_the_period() {
		$this->assertSame( 63, Period_Baseline::get_min_range_history_days( 7 ), 'A 7-day period should need 63 days of history: the period and two 28-day blocks.' );
		$this->assertSame( 84, Period_Baseline::get_min_range_history_days( 28 ), 'A 28-day period should need 84 days of history: the period and two 28-day blocks.' );
		$this->assertSame( 146, Period_Baseline::get_min_range_history_days( 90 ), 'A 90-day period should need 146 days of history: the period and two 28-day blocks.' );
		$this->assertSame( 84, Period_Baseline::get_min_range_history_days( 0 ), 'A period length that is not above 0 should be read as 28 days.' );
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
