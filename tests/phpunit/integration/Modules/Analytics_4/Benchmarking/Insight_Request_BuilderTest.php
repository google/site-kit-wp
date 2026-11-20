<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Insight_Request_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use DateTimeImmutable;
use DateTimeZone;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Insight_Request_Builder;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Period_Baseline;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Insight_Request_BuilderTest extends TestCase {

	/**
	 * The first day of the selected period, a 28-day period.
	 */
	const START_DATE = '2026-08-19';

	/**
	 * The last day of the selected period.
	 */
	const END_DATE = '2026-09-15';

	/**
	 * The first day of the daily series `Report_Options` asks for with the
	 * selected period: 364 days before the compare period starts, which for a
	 * 28-day period is also 392 days before the period starts, where the band
	 * of its first day reaches.
	 */
	const SERIES_START_DATE = '2025-07-23';

	/**
	 * Insight_Request_Builder instance.
	 *
	 * @var Insight_Request_Builder
	 */
	private $builder;

	public function set_up() {
		parent::set_up();

		$this->builder = new Insight_Request_Builder();
	}

	/**
	 * Builds the model of a day for each date from one day to another, with
	 * its visits, as `Response_Builder` builds it from the daily series.
	 *
	 * @param string   $first_date The first day, as `YYYY-MM-DD`.
	 * @param string   $last_date  The last day, as `YYYY-MM-DD`.
	 * @param callable $get_visits Gets the visits of a day from its position, `0` for `$first_date`.
	 * @return Period_Baseline The model of the days, from the first day with visits on.
	 */
	private function get_period_baseline( $first_date, $last_date, callable $get_visits ) {
		$utc    = new DateTimeZone( 'UTC' );
		$date   = new DateTimeImmutable( $first_date, $utc );
		$last   = new DateTimeImmutable( $last_date, $utc );
		$series = array();

		while ( $date <= $last ) {
			$series[] = array(
				'date'   => $date->format( 'Y-m-d' ),
				'visits' => $get_visits( count( $series ) ),
			);

			$date = $date->modify( '+1 day' );
		}

		return Period_Baseline::from_daily_series( $series );
	}

	/**
	 * Gets the visits of a day that vary from day to day.
	 *
	 * @param int $position The day's position in its series.
	 * @return int The visits.
	 */
	private function get_varying_visits( $position ) {
		return 200 + ( $position * 37 ) % 151;
	}

	/**
	 * Builds the request for the selected 28-day period, with the daily series
	 * `Report_Options` asks for and the given rows.
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @return array|null The request.
	 */
	private function build_with_rows( array $contextual_data ) {
		return $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline( self::SERIES_START_DATE, self::END_DATE, array( $this, 'get_varying_visits' ) ),
			array(
				'current'  => 7730,
				'previous' => 7714,
			),
			$contextual_data
		);
	}

	/**
	 * Gets every scalar value of a nested array with its path, such as
	 * `contextual_data.referrers.0.sessions.current`.
	 *
	 * @param array  $value The array.
	 * @param string $path  Optional. The path of the array. Default empty string.
	 * @return array The values, keyed by their paths.
	 */
	private function get_leaves( array $value, $path = '' ) {
		$leaves = array();

		foreach ( $value as $key => $item ) {
			$item_path = '' === $path ? (string) $key : "$path.$key";

			if ( is_array( $item ) ) {
				$leaves = array_merge( $leaves, $this->get_leaves( $item, $item_path ) );
			} else {
				$leaves[ $item_path ] = $item;
			}
		}

		return $leaves;
	}

	public function test_build__returns_the_request_for_the_selected_period() {
		$request = $this->build_with_rows(
			array(
				'channels' => array(
					array(
						'label'    => 'Direct',
						'current'  => 2730,
						'previous' => 2914,
					),
					array(
						'label'    => 'Organic Search',
						'current'  => 5000,
						'previous' => 4800,
					),
				),
			)
		);

		// The series covers last year's two periods, from `2025-07-23` to
		// `2025-08-19` and from `2025-08-20` to `2025-09-16`, and the 365 days
		// of reference of each day's fit, which end 28 days before the day.
		$this->assertSame(
			array(
				'end_date'        => '2026-09-15',
				'days_in_period'  => 28,
				'visits'          => array(
					'current_period'  => 7730,
					'previous_period' => 7714,
					'last_year'       => array(
						'current_period'  => 7522,
						'previous_period' => 7808,
					),
				),
				'baseline'        => array(
					'expected_range_min' => 6593,
					'expected_range_max' => 8826,
				),
				'contextual_data' => array(
					'traffic_channel_surges' => array(
						array(
							'channel'  => 'Organic Search',
							'sessions' => array(
								'current'  => 5000,
								'previous' => 4800,
							),
						),
						array(
							'channel'  => 'Direct',
							'sessions' => array(
								'current'  => 2730,
								'previous' => 2914,
							),
						),
					),
				),
				// The period is steady, and Direct fell by 2.5% of the site's
				// visits beyond the site's own rate, so its channels offset each
				// other. The panel shows no card, so the decomposition has
				// none, and the whole change is its residual.
				'decomposition'   => array(
					'opening_sessions' => 7714,
					'closing_sessions' => 7730,
					'residual_delta'   => 16,
					'shape'            => 'OFFSETTING',
					'key_factors'      => array(),
				),
			),
			$request,
			'The request should carry the end date, the period length, the visit totals with last year\'s, the expected range of `Period_Baseline`, the channel rows, and a decomposition without cards.'
		);
	}

	/**
	 * @dataProvider data_periods_without_an_insight
	 *
	 * @param string $start_date The first day of a period that ends on `2026-09-15`.
	 */
	public function test_build__returns_null_for_a_period_shorter_than_7_days_or_longer_than_364( $start_date ) {
		$this->assertNull(
			$this->builder->build(
				$start_date,
				self::END_DATE,
				$this->get_period_baseline( self::SERIES_START_DATE, self::END_DATE, array( $this, 'get_varying_visits' ) ),
				array(
					'current'  => 500,
					'previous' => 400,
				),
				array()
			),
			"The period from `$start_date` to `2026-09-15` should get no insight request."
		);
	}

	public function data_periods_without_an_insight() {
		return array(
			'1 day'    => array( '2026-09-15' ),
			'6 days'   => array( '2026-09-10' ),
			'365 days' => array( '2025-09-16' ),
		);
	}

	/**
	 * @dataProvider data_periods_with_an_insight
	 *
	 * @param string $start_date     The first day of a period that ends on `2026-09-15`.
	 * @param int    $days_in_period The number of days in the period.
	 */
	public function test_build__returns_a_request_for_a_period_of_7_to_364_days( $start_date, $days_in_period ) {
		$request = $this->builder->build(
			$start_date,
			self::END_DATE,
			$this->get_period_baseline( self::SERIES_START_DATE, self::END_DATE, array( $this, 'get_varying_visits' ) ),
			array(
				'current'  => 500,
				'previous' => 400,
			),
			array()
		);

		$this->assertIsArray( $request, "The period from `$start_date` to `2026-09-15` should get an insight request." );
		$this->assertSame( $days_in_period, $request['days_in_period'], "The request for the period from `$start_date` to `2026-09-15` should have $days_in_period days, both ends included." );
	}

	public function data_periods_with_an_insight() {
		return array(
			'7 days'   => array( '2026-09-09', 7 ),
			'90 days'  => array( '2026-06-18', 90 ),
			'364 days' => array( '2025-09-17', 364 ),
		);
	}

	/**
	 * @dataProvider data_visits_without_an_insight
	 *
	 * @param array $visits The visits of the two periods.
	 */
	public function test_build__returns_null_when_neither_period_has_a_visit( array $visits ) {
		$this->assertNull(
			$this->builder->build(
				self::START_DATE,
				self::END_DATE,
				$this->get_period_baseline( self::SERIES_START_DATE, self::END_DATE, array( $this, 'get_varying_visits' ) ),
				$visits,
				array()
			),
			'Two periods without a visit should get no insight request, since the service refuses it.'
		);
	}

	public function data_visits_without_an_insight() {
		return array(
			'0 and 0'          => array(
				array(
					'current'  => 0,
					'previous' => 0,
				),
			),
			'no totals'        => array( array() ),
			'0 as strings'     => array(
				array(
					'current'  => '0',
					'previous' => '0',
				),
			),
			'negative and 0'   => array(
				array(
					'current'  => -5,
					'previous' => 0,
				),
			),
			'only a current 0' => array( array( 'current' => 0 ) ),
		);
	}

	/**
	 * @dataProvider data_visit_totals
	 *
	 * @param array $visits          The visits of the two periods.
	 * @param int   $current_period  The visits the request should send for the selected period.
	 * @param int   $previous_period The visits the request should send for the compare period.
	 */
	public function test_build__sends_the_visit_totals_as_integers( array $visits, $current_period, $previous_period ) {
		$request = $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline( self::SERIES_START_DATE, self::END_DATE, array( $this, 'get_varying_visits' ) ),
			$visits,
			array()
		);

		$this->assertSame( $current_period, $request['visits']['current_period'], 'The visits of the selected period should be sent as an integer, never below 0.' );
		$this->assertSame( $previous_period, $request['visits']['previous_period'], 'The visits of the compare period should be sent as an integer, never below 0.' );
	}

	public function data_visit_totals() {
		return array(
			'integers'                 => array(
				array(
					'current'  => 412,
					'previous' => 388,
				),
				412,
				388,
			),
			'a string and a float'     => array(
				array(
					'current'  => '412',
					'previous' => 388.0,
				),
				412,
				388,
			),
			'no visit in the selected' => array(
				array(
					'current'  => 0,
					'previous' => 50,
				),
				0,
				50,
			),
			'no visit in the compare'  => array(
				array(
					'current'  => 50,
					'previous' => 0,
				),
				50,
				0,
			),
			'a negative total'         => array(
				array(
					'current'  => -3,
					'previous' => 10,
				),
				0,
				10,
			),
		);
	}

	public function test_build__sends_the_history_days_in_place_of_a_baseline_below_the_minimum_history() {
		// 110 days, from `2026-05-29`, are one short of the 111 a 28-day period
		// needs for a range: its first day needs the 84 days of its own fit.
		$request = $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline( '2026-05-29', self::END_DATE, array( $this, 'get_varying_visits' ) ),
			array(
				'current'  => 7596,
				'previous' => 7882,
			),
			array()
		);

		$this->assertArrayNotHasKey( 'baseline', $request, 'A site with 110 days of history should get no expected range for a 28-day period.' );
		$this->assertSame( 110, $request['history_days'], 'The request should carry the 110 days of history, so the service can say when the site will have a range.' );
		$this->assertArrayNotHasKey( 'last_year', $request['visits'], 'A site with 110 days of history should have no visits a year ago.' );
	}

	public function test_build__sends_a_baseline_from_the_minimum_history_on() {
		$request = $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline( '2026-05-28', self::END_DATE, array( $this, 'get_varying_visits' ) ),
			array(
				'current'  => 7726,
				'previous' => 7861,
			),
			array()
		);

		$this->assertSame(
			array(
				'expected_range_min' => 5877,
				'expected_range_max' => 9579,
			),
			$request['baseline'],
			'A site with 111 days of history should get an expected range for a 28-day period.'
		);
		$this->assertArrayNotHasKey( 'history_days', $request, 'A request with an expected range should carry no history days.' );
	}

	public function test_build__counts_the_history_from_the_first_day_with_visits() {
		// The site recorded no visit for the first 309 days of the series, so its
		// history is the same 111 days as in the test above, and a year ago it
		// wasn't measured yet.
		$request = $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline(
				self::SERIES_START_DATE,
				self::END_DATE,
				fn( $position ) => $position < 309 ? 0 : $this->get_varying_visits( $position - 309 )
			),
			array(
				'current'  => 7726,
				'previous' => 7861,
			),
			array()
		);

		$this->assertSame(
			array(
				'expected_range_min' => 5877,
				'expected_range_max' => 9579,
			),
			$request['baseline'],
			'The days before the first day with visits should not count towards the history the expected range is fitted on.'
		);
		$this->assertSame(
			array(
				'current_period'  => 7726,
				'previous_period' => 7861,
			),
			$request['visits'],
			'Last year\'s periods, before the first day with visits, should be left out rather than sent as periods without visits.'
		);
	}

	public function test_build__counts_the_history_days_from_the_first_day_with_visits() {
		$request = $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline(
				self::SERIES_START_DATE,
				self::END_DATE,
				fn( $position ) => $position < 337 ? 0 : $this->get_varying_visits( $position )
			),
			array(
				'current'  => 7800,
				'previous' => 7500,
			),
			array()
		);

		$this->assertSame( 83, $request['history_days'], 'The history days should count from the first day with visits, not from the first day of the series.' );
	}

	public function test_build__sends_last_years_visits_and_the_baseline_of_a_7_day_period() {
		// The series `Report_Options` asks for with a 7-day period starts on
		// `2025-08-13`, 392 days before the period, where the band of its first
		// day reaches, before last year's compare period starts on `2025-09-03`.
		$request = $this->builder->build(
			'2026-09-09',
			self::END_DATE,
			$this->get_period_baseline( '2025-08-13', self::END_DATE, array( $this, 'get_varying_visits' ) ),
			array(
				'current'  => 1780,
				'previous' => 1930,
			),
			array()
		);

		$this->assertSame(
			array(
				'end_date'       => '2026-09-15',
				'days_in_period' => 7,
				'visits'         => array(
					'current_period'  => 1780,
					'previous_period' => 1930,
					'last_year'       => array(
						'current_period'  => 1879,
						'previous_period' => 1878,
					),
				),
				'baseline'       => array(
					'expected_range_min' => 1566,
					'expected_range_max' => 2281,
				),
			),
			$request,
			'A 7-day period should get last year\'s two 7-day periods and its own expected range.'
		);
	}

	public function test_build__lists_every_channel_device_and_visitor_type_with_the_most_visited_first() {
		$request = $this->build_with_rows(
			array(
				'channels'   => array(
					array(
						'label'    => 'Referral',
						'current'  => 50,
						'previous' => 80,
					),
					array(
						'label'    => 'Organic Search',
						'current'  => 400,
						'previous' => 300,
					),
					array(
						'label'    => 'Direct',
						'current'  => 50,
						'previous' => 20,
					),
					array(
						'label'    => 'Email',
						'current'  => 0,
						'previous' => 12,
					),
				),
				'devices'    => array(
					array(
						'label'    => 'tablet',
						'current'  => '7',
						'previous' => 9.0,
					),
					array(
						'label'    => 'mobile',
						'current'  => 300,
						'previous' => 250,
					),
				),
				'visitorMix' => array(
					array(
						'label'    => 'returning',
						'current'  => 200,
						'previous' => 150,
					),
					array(
						'label'    => 'new',
						'current'  => 300,
						'previous' => 320,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'traffic_channel_surges' => array(
					array(
						'channel'  => 'Organic Search',
						'sessions' => array(
							'current'  => 400,
							'previous' => 300,
						),
					),
					array(
						'channel'  => 'Direct',
						'sessions' => array(
							'current'  => 50,
							'previous' => 20,
						),
					),
					array(
						'channel'  => 'Referral',
						'sessions' => array(
							'current'  => 50,
							'previous' => 80,
						),
					),
					array(
						'channel'  => 'Email',
						'sessions' => array(
							'current'  => 0,
							'previous' => 12,
						),
					),
				),
				'device_shifts'          => array(
					array(
						'device'   => 'mobile',
						'sessions' => array(
							'current'  => 300,
							'previous' => 250,
						),
					),
					array(
						'device'   => 'tablet',
						'sessions' => array(
							'current'  => 7,
							'previous' => 9,
						),
					),
				),
				'user_mix_shifts'        => array(
					array(
						'segment'  => 'new',
						'sessions' => array(
							'current'  => 300,
							'previous' => 320,
						),
					),
					array(
						'segment'  => 'returning',
						'sessions' => array(
							'current'  => 200,
							'previous' => 150,
						),
					),
				),
			),
			$request['contextual_data'],
			'Every channel, device and visitor type should be listed, the one with the most visits in the selected period first, then by label, with integer counts.'
		);
	}

	public function test_build__lists_the_10_referrers_that_moved_most() {
		$referrers = array_map(
			fn( $n ) => array(
				'label'    => "site-$n.example.com",
				'current'  => 10 * $n,
				'previous' => 0,
			),
			range( 1, 12 )
		);

		$request = $this->build_with_rows( array( 'referrers' => $referrers ) );

		$this->assertSame(
			array_map( fn( $n ) => "site-$n.example.com", range( 12, 3 ) ),
			array_column( $request['contextual_data']['referrers'], 'referrer' ),
			'The 10 referrers whose visits changed most should be listed, the one that changed most first.'
		);
		$this->assertSame(
			array(
				'referrer' => 'site-12.example.com',
				'sessions' => array(
					'current'  => 120,
					'previous' => 0,
				),
			),
			$request['contextual_data']['referrers'][0],
			'A referrer should be listed with its visits in each period.'
		);
	}

	public function test_build__orders_referrers_that_moved_as_much_by_their_larger_period_and_then_by_label() {
		$request = $this->build_with_rows(
			array(
				'referrers' => array(
					array(
						'label'    => 'd.example.com',
						'current'  => 90,
						'previous' => 10,
					),
					array(
						'label'    => 'b.example.com',
						'current'  => 10,
						'previous' => 100,
					),
					array(
						'label'    => 'c.example.com',
						'current'  => 200,
						'previous' => 120,
					),
					array(
						'label'    => 'a.example.com',
						'current'  => 100,
						'previous' => 10,
					),
				),
			)
		);

		$this->assertSame(
			array( 'a.example.com', 'b.example.com', 'c.example.com', 'd.example.com' ),
			array_column( $request['contextual_data']['referrers'], 'referrer' ),
			'Referrers should be ordered by how much their visits changed, then by their larger period, and then by label.'
		);
	}

	public function test_build__leaves_out_placeholder_referrers_and_referrers_without_more_than_one_visit() {
		$request = $this->build_with_rows(
			array(
				'referrers' => array(
					array(
						'label'    => '(not set)',
						'current'  => 500,
						'previous' => 0,
					),
					array(
						'label'    => '(direct)',
						'current'  => 400,
						'previous' => 10,
					),
					array(
						'label'    => '   ',
						'current'  => 300,
						'previous' => 0,
					),
					array(
						'label'    => 'one.example.com',
						'current'  => 1,
						'previous' => 0,
					),
					array(
						'label'    => 'zero.example.com',
						'current'  => 0,
						'previous' => 1,
					),
					array(
						'label'    => 'two.example.com',
						'current'  => 0,
						'previous' => 2,
					),
					array(
						'label'    => 'news.example.com (amp)',
						'current'  => 5,
						'previous' => 3,
					),
				),
			)
		);

		$this->assertSame(
			array( 'news.example.com (amp)', 'two.example.com' ),
			array_column( $request['contextual_data']['referrers'], 'referrer' ),
			'Placeholders such as `(not set)`, empty labels, and referrers with at most one visit in each period should be left out.'
		);
	}

	public function test_build__lists_the_10_search_queries_whose_clicks_moved_most() {
		$queries = array_map(
			fn( $n ) => array(
				'label'            => "query $n",
				'current'          => 100 + $n,
				'previous'         => 100,
				'positionCurrent'  => 5.0,
				'positionPrevious' => 6.0,
			),
			range( 1, 12 )
		);

		$request = $this->build_with_rows( array( 'searchQueries' => $queries ) );

		$this->assertSame(
			array_map( fn( $n ) => "query $n", range( 12, 3 ) ),
			array_column( $request['contextual_data']['search_query_shifts'], 'query' ),
			'The 10 search queries whose clicks changed most should be listed, the one that changed most first.'
		);
	}

	public function test_build__sends_each_search_querys_clicks_and_positions_rounded_to_one_decimal() {
		$request = $this->build_with_rows(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 210,
						'positionCurrent'  => 3.44,
						'positionPrevious' => 4.86,
					),
					array(
						'label'            => 'garlic varieties',
						'current'          => '12',
						'previous'         => 0,
						'positionCurrent'  => 7.04,
						'positionPrevious' => null,
					),
					array(
						'label'            => 'when to harvest garlic',
						'current'          => 0,
						'previous'         => 4,
						'positionCurrent'  => null,
						'positionPrevious' => 12,
					),
					array(
						'label'            => '   ',
						'current'          => 900,
						'previous'         => 0,
						'positionCurrent'  => 1.0,
						'positionPrevious' => null,
					),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'query'    => 'plant garlic',
					'clicks'   => array(
						'current'  => 300,
						'previous' => 210,
					),
					'position' => array(
						'current'  => 3.4,
						'previous' => 4.9,
					),
				),
				array(
					'query'    => 'garlic varieties',
					'clicks'   => array(
						'current'  => 12,
						'previous' => 0,
					),
					'position' => array(
						'current'  => 7.0,
						'previous' => 0.0,
					),
				),
				array(
					'query'    => 'when to harvest garlic',
					'clicks'   => array(
						'current'  => 0,
						'previous' => 4,
					),
					'position' => array(
						'current'  => 0.0,
						'previous' => 12.0,
					),
				),
			),
			$request['contextual_data']['search_query_shifts'],
			'Each search query should carry its clicks as integers and its positions as floats rounded to one decimal, with `0.0` for a period it was not reported in. A query with an empty label should be left out.'
		);
	}

	public function test_build__lists_the_most_visited_posts_published_during_the_period() {
		$post = fn( $url, $published_days_ago, $current ) => array(
			'url'              => $url,
			'title'            => "Title of $url",
			'publishedDaysAgo' => $published_days_ago,
			'current'          => $current,
			'previous'         => 0,
		);

		$request = $this->build_with_rows(
			array(
				'content' => array(
					$post( '/a-post-on-the-first-day/', 28, 50 ),
					$post( '/an-older-post/', 29, 500 ),
					$post( '/an-unvisited-post/', 5, 0 ),
					$post( '/homework/', 2, 80 ),
					$post( '/a-new-post/', 3, 120 ),
					$post( '/b-new-post/', 1, 120 ),
					$post( '', 0, 900 ),
					$post( '/', 0, 900 ),
					$post( '/Home/', 0, 900 ),
					$post( '/index.php', 0, 900 ),
					$post( '/index.html/', 0, 900 ),
					$post( 'https://example.com/index.html?utm_source=newsletter', 0, 900 ),
					$post( 'https://example.com', 0, 900 ),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'url'                => '/a-new-post/',
					'title'              => 'Title of /a-new-post/',
					'published_days_ago' => 3,
					'sessions'           => 120,
				),
				array(
					'url'                => '/b-new-post/',
					'title'              => 'Title of /b-new-post/',
					'published_days_ago' => 1,
					'sessions'           => 120,
				),
				array(
					'url'                => '/homework/',
					'title'              => 'Title of /homework/',
					'published_days_ago' => 2,
					'sessions'           => 80,
				),
				array(
					'url'                => '/a-post-on-the-first-day/',
					'title'              => 'Title of /a-post-on-the-first-day/',
					'published_days_ago' => 28,
					'sessions'           => 50,
				),
			),
			$request['contextual_data']['recent_content_momentum'],
			'The posts published during the period with visits in it should be listed, the most visited first and then by URL, without the home page in any form.'
		);
	}

	public function test_build__lists_at_most_10_recent_posts() {
		$posts = array_map(
			fn( $n ) => array(
				'url'              => "/post-$n/",
				'title'            => "Post $n",
				'publishedDaysAgo' => 1,
				'current'          => 10 * $n,
				'previous'         => 0,
			),
			range( 1, 12 )
		);

		$request = $this->build_with_rows( array( 'content' => $posts ) );

		$this->assertSame(
			array_map( fn( $n ) => "/post-$n/", range( 12, 3 ) ),
			array_column( $request['contextual_data']['recent_content_momentum'], 'url' ),
			'The 10 most visited recent posts should be listed.'
		);
	}

	public function test_build__lists_every_channel_breakdown_with_the_most_visited_first() {
		$breakdown = fn( $channel, $device, $user_type, $current, $previous ) => array(
			'channel'  => $channel,
			'device'   => $device,
			'userType' => $user_type,
			'current'  => $current,
			'previous' => $previous,
		);

		$request = $this->build_with_rows(
			array(
				'channelBreakdowns' => array(
					$breakdown( 'Direct', 'mobile', 'returning', 40, 40 ),
					$breakdown( 'Organic Search', 'desktop', 'new', 0, 15 ),
					$breakdown( 'Organic Search', 'mobile', 'new', 300, 200 ),
					$breakdown( 'Direct', 'desktop', '(not set)', 40, 30 ),
				),
			)
		);

		$segment = fn( $channel, $device, $segment, $current, $previous ) => array(
			'channel'  => $channel,
			'device'   => $device,
			'segment'  => $segment,
			'sessions' => array(
				'current'  => $current,
				'previous' => $previous,
			),
		);

		$this->assertSame(
			array(
				$segment( 'Organic Search', 'mobile', 'new', 300, 200 ),
				$segment( 'Direct', 'desktop', '(not set)', 40, 30 ),
				$segment( 'Direct', 'mobile', 'returning', 40, 40 ),
				$segment( 'Organic Search', 'desktop', 'new', 0, 15 ),
			),
			$request['contextual_data']['channel_breakdowns'],
			'Every row of the channel breakdown should be listed with its visitor type as `segment`, raw, the most visited first and then by channel, device and segment.'
		);
	}

	public function test_build__lists_the_30_landing_pages_of_each_channel_that_rose_most_and_the_30_that_fell_most() {
		$page = fn( $channel, $page, $current, $previous ) => array(
			'channel'  => $channel,
			'page'     => $page,
			'current'  => $current,
			'previous' => $previous,
		);

		$rows = array( $page( 'Organic Search', '/unchanged/', 500, 500 ) );

		foreach ( range( 1, 32 ) as $n ) {
			$rows[] = $page( 'Organic Search', "/rise-$n/", 100 + $n, 100 );
			$rows[] = $page( 'Organic Search', "/fall-$n/", 100, 100 + $n );
		}

		$rows[] = $page( 'Direct', '/', 90, 50 );

		$request = $this->build_with_rows( array( 'channelPages' => $rows ) );
		$urls    = array_column( $request['contextual_data']['channel_pages'], 'url' );

		$this->assertCount( 61, $urls, 'Organic Search should list 30 pages in each direction, and Direct its one page.' );
		$this->assertSame(
			array( '/', '/fall-32/', '/rise-32/', '/fall-31/', '/rise-31/' ),
			array_slice( $urls, 0, 5 ),
			'The pages should be listed by how far they moved, then by their larger period, then by channel and page.'
		);
		$this->assertSame(
			array( '/fall-3/', '/rise-3/' ),
			array_slice( $urls, -2 ),
			'The pages that moved least in each direction should be left out.'
		);
		$this->assertNotContains( '/unchanged/', $urls, 'A page whose visits did not change should be left out.' );
		$this->assertSame(
			array(
				'channel'  => 'Direct',
				'url'      => '/',
				'sessions' => array(
					'current'  => 90,
					'previous' => 50,
				),
			),
			$request['contextual_data']['channel_pages'][0],
			'A page should be listed with its channel, its address as `url`, and its visits.'
		);
	}

	public function test_build__lists_the_5_campaigns_of_each_channel_that_moved_most() {
		$campaign = fn( $channel, $campaign, $current, $previous ) => array(
			'channel'  => $channel,
			'campaign' => $campaign,
			'current'  => $current,
			'previous' => $previous,
		);

		$request = $this->build_with_rows(
			array(
				'channelCampaigns' => array(
					$campaign( 'Email', '(not set)', 900, 100 ),
					$campaign( 'Email', 'unchanged', 400, 400 ),
					$campaign( 'Email', 'news-1', 110, 100 ),
					$campaign( 'Email', 'news-2', 100, 120 ),
					$campaign( 'Email', 'news-3', 130, 100 ),
					$campaign( 'Email', 'news-4', 100, 140 ),
					$campaign( 'Email', 'news-5', 150, 100 ),
					$campaign( 'Email', 'news-6', 100, 160 ),
					$campaign( 'Organic Social', '(organic)', 300, 0 ),
					$campaign( 'Organic Social', 'launch', 5, 0 ),
				),
			)
		);

		$this->assertSame(
			array(
				array( 'Email', 'news-6' ),
				array( 'Email', 'news-5' ),
				array( 'Email', 'news-4' ),
				array( 'Email', 'news-3' ),
				array( 'Email', 'news-2' ),
				array( 'Organic Social', 'launch' ),
			),
			array_map(
				fn( $row ) => array( $row['channel'], $row['campaign'] ),
				$request['contextual_data']['channel_campaigns']
			),
			'Each channel should list the 5 named campaigns that moved most, without a placeholder or a campaign whose visits did not change.'
		);
	}

	public function test_build__sends_the_site_search_clicks() {
		$request = $this->build_with_rows(
			array(
				'searchClicks' => array(
					array(
						'current'  => '1250',
						'previous' => 980.0,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'current'  => 1250,
				'previous' => 980,
			),
			$request['contextual_data']['search_clicks'],
			'The site\'s search clicks should be sent as integers.'
		);
		$this->assertArrayNotHasKey( 'contextual_data', $this->build_with_rows( array( 'searchClicks' => array() ) ), 'Without the site\'s search clicks, the request should carry no `search_clicks`.' );
	}

	public function test_build__lists_the_20_most_visited_pages_of_each_period_over_every_channel() {
		$rows = array(
			array(
				'channel'  => 'Organic Search',
				'page'     => '/',
				'current'  => 300,
				'previous' => 10,
			),
			array(
				'channel'  => 'Direct',
				'page'     => '/',
				'current'  => 200,
				'previous' => 10,
			),
			array(
				'channel'  => 'Referral',
				'page'     => '/?utm_source=newsletter',
				'current'  => 50,
				'previous' => 0,
			),
			array(
				'channel'  => 'Direct',
				'page'     => '(not set)',
				'current'  => 900,
				'previous' => 900,
			),
		);

		foreach ( range( 1, 22 ) as $n ) {
			$rows[] = array(
				'channel'  => 'Organic Search',
				'page'     => sprintf( '/page-%02d/', $n ),
				'current'  => 100 - $n,
				'previous' => $n,
			);
		}

		$request = $this->build_with_rows( array( 'channelPages' => $rows ) );

		$this->assertSame(
			array_merge(
				array(
					array(
						'url'    => '/',
						'visits' => 550,
					),
				),
				array_map(
					fn( $n ) => array(
						'url'    => sprintf( '/page-%02d/', $n ),
						'visits' => 100 - $n,
					),
					range( 1, 19 )
				)
			),
			$request['contextual_data']['top_pages'],
			'The 20 most visited pages of the selected period should be listed, each with its visits through every channel and without its query, the home page included and the placeholder left out.'
		);
		// The home page's 20 visits tie with `/page-20/`, which its path sorts
		// before.
		$this->assertSame(
			array_merge(
				array( '/page-22/', '/page-21/', '/' ),
				array_map( fn( $n ) => sprintf( '/page-%02d/', $n ), range( 20, 4 ) )
			),
			array_column( $request['contextual_data']['previous_top_pages'], 'url' ),
			'The 20 most visited pages of the compare period should be listed, the most visited first and then by path.'
		);
	}

	public function test_build__lists_the_categories_of_each_post_published_by_the_last_day_of_the_period() {
		$this->set_permalink_structure( '/%postname%/' );

		$garden = self::factory()->category->create( array( 'name' => 'Garden' ) );
		$food   = self::factory()->category->create( array( 'name' => 'Food & Drink' ) );

		// Published during the selected period, which ends on `2026-09-15`, and
		// after the compare period, which ends on `2026-08-18`.
		self::factory()->post->create(
			array(
				'post_name'     => 'plant-garlic',
				'post_date'     => '2026-09-01 10:00:00',
				'post_date_gmt' => '2026-09-01 10:00:00',
				'post_category' => array( $garden, $food ),
			)
		);
		self::factory()->post->create(
			array(
				'post_name'     => 'raised-beds',
				'post_date'     => '2026-01-10 10:00:00',
				'post_date_gmt' => '2026-01-10 10:00:00',
				'post_category' => array( $garden ),
			)
		);
		self::factory()->post->create(
			array(
				'post_name'     => 'a-draft',
				'post_status'   => 'draft',
				'post_date'     => '2026-01-10 10:00:00',
				'post_date_gmt' => '2026-01-10 10:00:00',
				'post_category' => array( $garden ),
			)
		);
		self::factory()->post->create(
			array(
				'post_type' => 'page',
				'post_name' => 'about',
			)
		);

		$request = $this->build_with_rows(
			array(
				'channelPages' => array_map(
					fn( $page ) => array(
						'channel'  => 'Organic Search',
						'page'     => $page,
						'current'  => 100,
						'previous' => 100,
					),
					array( '/plant-garlic/', '/raised-beds/', '/a-draft/', '/about/', '/' )
				),
			)
		);

		$categories = fn( $pages ) => array_combine(
			array_column( $pages, 'url' ),
			array_map( fn( $page ) => isset( $page['categories'] ) ? $page['categories'] : null, $pages )
		);

		$this->assertSame(
			array(
				'/'              => null,
				'/a-draft/'      => null,
				'/about/'        => null,
				'/plant-garlic/' => array( 'Food & Drink', 'Garden' ),
				'/raised-beds/'  => array( 'Garden' ),
			),
			$categories( $request['contextual_data']['top_pages'] ),
			'A published post should carry the names of its categories in the selected period, and a draft, a page and the home page none.'
		);
		$this->assertSame(
			array(
				'/'              => null,
				'/a-draft/'      => null,
				'/about/'        => null,
				'/plant-garlic/' => null,
				'/raised-beds/'  => array( 'Garden' ),
			),
			$categories( $request['contextual_data']['previous_top_pages'] ),
			'A post published after the compare period should carry no categories in it.'
		);
	}

	public function test_build__sends_the_key_factor_cards_as_the_decomposition() {
		$request = $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline( self::SERIES_START_DATE, self::END_DATE, array( $this, 'get_varying_visits' ) ),
			array(
				'current'  => 7730,
				'previous' => 7714,
			),
			array(
				'channels' => array(
					array(
						'label'    => 'Direct',
						'current'  => 2730,
						'previous' => 2914,
					),
					array(
						'label'    => 'Organic Search',
						'current'  => 5000,
						'previous' => 4800,
					),
				),
			),
			array(
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Organic Search',
					'current'    => 5000,
					'previous'   => 4800,
					'sharePct'   => 100.0,
					'attributes' => array(),
				),
			)
		);

		$this->assertSame(
			array( 'Organic Search' ),
			array_column( $request['decomposition']['key_factors'], 'title' ),
			'The decomposition should carry the key factor card.'
		);
		$this->assertSame( 16 - 200, $request['decomposition']['residual_delta'], 'The residual should be the site\'s change less the card\'s.' );
		$this->assertSame( 'decomposition', array_key_last( $request ), 'The decomposition should close the request, after the contextual data.' );
	}

	public function test_build__sends_no_decomposition_without_channels() {
		$request = $this->build_with_rows(
			array(
				'devices' => array(
					array(
						'label'    => 'mobile',
						'current'  => 300,
						'previous' => 250,
					),
				),
			)
		);

		$this->assertArrayNotHasKey( 'decomposition', $request, 'Without channels, the cards\' changes add up to nothing, so the request should carry no decomposition.' );
	}

	public function test_build__leaves_out_each_contextual_field_without_rows() {
		$request = $this->build_with_rows(
			array(
				'channels'   => array(
					array(
						'label'    => 'Direct',
						'current'  => 10,
						'previous' => 5,
					),
				),
				'devices'    => array(),
				'referrers'  => array(
					array(
						'label'    => '(not set)',
						'current'  => 100,
						'previous' => 50,
					),
				),
				'categories' => array(
					array(
						'label'    => 'Garden',
						'current'  => 60,
						'previous' => 20,
					),
				),
			)
		);

		$this->assertSame(
			array( 'traffic_channel_surges' ),
			array_keys( $request['contextual_data'] ),
			'Only the fields with rows should be sent: no empty device list, no referrers once their placeholder is left out, and nothing for the categories, which the service does not read.'
		);
	}

	public function test_build__leaves_out_the_contextual_data_when_no_field_has_rows() {
		$request = $this->build_with_rows(
			array(
				'devices'       => array(),
				'searchQueries' => array(),
			)
		);

		$this->assertArrayNotHasKey( 'contextual_data', $request, 'A request without any contextual row should carry no `contextual_data`.' );
	}

	public function test_build__returns_the_same_request_for_the_same_rows_in_any_order() {
		$contextual_data = array(
			'channels'      => array(
				array(
					'label'    => 'Referral',
					'current'  => 50,
					'previous' => 80,
				),
				array(
					'label'    => 'Direct',
					'current'  => 50,
					'previous' => 20,
				),
				array(
					'label'    => 'Organic Search',
					'current'  => 400,
					'previous' => 300,
				),
			),
			'referrers'     => array(
				array(
					'label'    => 'b.example.com',
					'current'  => 10,
					'previous' => 100,
				),
				array(
					'label'    => 'a.example.com',
					'current'  => 100,
					'previous' => 10,
				),
			),
			'searchQueries' => array(
				array(
					'label'            => 'garlic',
					'current'          => 20,
					'previous'         => 10,
					'positionCurrent'  => 2.0,
					'positionPrevious' => 3.0,
				),
				array(
					'label'            => 'onion',
					'current'          => 10,
					'previous'         => 20,
					'positionCurrent'  => 4.0,
					'positionPrevious' => 5.0,
				),
			),
			'content'       => array(
				array(
					'url'              => '/b/',
					'title'            => 'B',
					'publishedDaysAgo' => 3,
					'current'          => 40,
					'previous'         => 0,
				),
				array(
					'url'              => '/a/',
					'title'            => 'A',
					'publishedDaysAgo' => 4,
					'current'          => 40,
					'previous'         => 0,
				),
			),
		);

		$contextual_data['channelBreakdowns'] = array(
			array(
				'channel'  => 'Organic Search',
				'device'   => 'mobile',
				'userType' => 'new',
				'current'  => 40,
				'previous' => 30,
			),
			array(
				'channel'  => 'Direct',
				'device'   => 'desktop',
				'userType' => 'returning',
				'current'  => 40,
				'previous' => 20,
			),
		);
		$contextual_data['channelPages']      = array(
			array(
				'channel'  => 'Organic Search',
				'page'     => '/b/',
				'current'  => 40,
				'previous' => 20,
			),
			array(
				'channel'  => 'Organic Search',
				'page'     => '/a/',
				'current'  => 20,
				'previous' => 40,
			),
			array(
				'channel'  => 'Direct',
				'page'     => '/a/',
				'current'  => 40,
				'previous' => 20,
			),
		);
		$contextual_data['channelCampaigns']  = array(
			array(
				'channel'  => 'Email',
				'campaign' => 'b',
				'current'  => 10,
				'previous' => 20,
			),
			array(
				'channel'  => 'Email',
				'campaign' => 'a',
				'current'  => 20,
				'previous' => 10,
			),
		);

		$reversed_data = array_map( 'array_reverse', $contextual_data );
		$request       = $this->build_with_rows( $contextual_data );

		$this->assertSame( $request, $this->build_with_rows( $contextual_data ), 'Building the request twice from the same rows should give the same request.' );
		$this->assertSame( $request, $this->build_with_rows( $reversed_data ), 'Building the request from the same rows in reverse order should give the same request.' );
	}

	public function test_build__sends_every_count_as_an_integer() {
		$request = $this->builder->build(
			self::START_DATE,
			self::END_DATE,
			$this->get_period_baseline( self::SERIES_START_DATE, self::END_DATE, fn( $position ) => (string) $this->get_varying_visits( $position ) ),
			array(
				'current'  => '7730',
				'previous' => 7714.0,
			),
			array(
				'channels'          => array(
					array(
						'label'    => 'Direct',
						'current'  => '10',
						'previous' => 5.0,
					),
				),
				'referrers'         => array(
					array(
						'label'    => 'a.example.com',
						'current'  => 12.0,
						'previous' => '3',
					),
				),
				'searchQueries'     => array(
					array(
						'label'            => 'garlic',
						'current'          => '20',
						'previous'         => 10.0,
						'positionCurrent'  => '2.25',
						'positionPrevious' => 3,
					),
				),
				'content'           => array(
					array(
						'url'              => '/a/',
						'title'            => 'A',
						'publishedDaysAgo' => '4',
						'current'          => 40.0,
						'previous'         => '0',
					),
				),
				'channelBreakdowns' => array(
					array(
						'channel'  => 'Direct',
						'device'   => 'mobile',
						'userType' => 'new',
						'current'  => '10',
						'previous' => 5.0,
					),
				),
				'channelPages'      => array(
					array(
						'channel'  => 'Direct',
						'page'     => '/a/',
						'current'  => 7.0,
						'previous' => '3',
					),
				),
				'channelCampaigns'  => array(
					array(
						'channel'  => 'Email',
						'campaign' => 'spring-sale',
						'current'  => '4',
						'previous' => 2.0,
					),
				),
				'searchClicks'      => array(
					array(
						'current'  => '25',
						'previous' => 15.0,
					),
				),
			),
			array(
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Direct',
					'current'    => '10',
					'previous'   => 5.0,
					'sharePct'   => 100.0,
					'attributes' => array(
						array(
							'kind'     => 'LANDING_PAGE',
							'label'    => '/a/',
							'current'  => 7.0,
							'previous' => '3',
							'sharePct' => 80.0,
						),
					),
				),
			)
		);

		$leaves    = $this->get_leaves( $request );
		$positions = array_filter( $leaves, fn( $path ) => false !== strpos( $path, '.position.' ), ARRAY_FILTER_USE_KEY );
		// A card's share and excess change, and a row's share, are the
		// request's other numbers with decimals.
		$decimals = array_filter( $leaves, fn( $path ) => (bool) preg_match( '/(_pct|\.excess)$/', $path ), ARRAY_FILTER_USE_KEY );
		$counts   = array_filter( array_diff_key( $leaves, $positions, $decimals ), 'is_numeric' );

		$this->assertArrayHasKey( 'decomposition.key_factors.0.attributes.0.entity_delta', $counts, 'The request should have the counts of the decomposition.' );
		$this->assertArrayHasKey( 'contextual_data.search_clicks.current', $counts, 'The request should have the counts of the contextual data.' );
		$this->assertSame( array(), array_keys( array_filter( $counts, fn( $value ) => ! is_int( $value ) ) ), 'Every count of the request should be an integer, since the service refuses a count with a decimal point.' );
		$this->assertSame( array(), array_keys( array_filter( $positions, fn( $value ) => ! is_float( $value ) ) ), 'Every position of the request should be a float.' );
		$this->assertNotEmpty( $decimals, 'The request should have the shares of the decomposition.' );
		$this->assertSame( array(), array_keys( array_filter( $decimals, fn( $value ) => ! is_float( $value ) ) ), 'Every share and excess change of the request should be a float.' );
		$this->assertSame( 'a.example.com', $request['contextual_data']['referrers'][0]['referrer'], 'A label should be sent as a string.' );
	}
}
