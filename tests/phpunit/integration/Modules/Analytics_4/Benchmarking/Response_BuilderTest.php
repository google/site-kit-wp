<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Response_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Analytics_4
 */
class Response_BuilderTest extends TestCase {

	/**
	 * Custom_Dimensions_Data_Available instance.
	 *
	 * @var Custom_Dimensions_Data_Available
	 */
	private $custom_dimensions_data_available;

	/**
	 * Response_Builder instance.
	 *
	 * @var Response_Builder
	 */
	private $builder;

	/**
	 * Rows the fake Analytics API returns, keyed by the first dimension a report
	 * asks for.
	 *
	 * Each row lists its dimension values, then its visitors.
	 *
	 * @var array
	 */
	private $report_rows = array();

	/**
	 * Body of each `batchRunReports` request the fake Analytics API received.
	 *
	 * @var array
	 */
	private $batch_requests = array();

	/**
	 * The `batchRunReports` call the fake Analytics API refuses, such as `1` for
	 * the first call, or `0` when it refuses none.
	 *
	 * @var int
	 */
	private $refused_batch_call = 0;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user_id );
		$authentication = new Authentication( $context, $options, $user_options );

		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-token' ) );
		$authentication->get_oauth_client()->set_granted_scopes(
			array_merge(
				$authentication->get_oauth_client()->get_required_scopes(),
				array( Analytics_4::READONLY_SCOPE )
			)
		);

		$analytics = new Analytics_4( $context, $options, $user_options, $authentication );
		$analytics->get_settings()->merge( array( 'propertyID' => '12345' ) );

		FakeHttp::fake_google_http_handler(
			$analytics->get_client(),
			function ( Request $request ) {
				$batch_request          = json_decode( (string) $request->getBody(), true );
				$this->batch_requests[] = $batch_request;

				if ( count( $this->batch_requests ) === $this->refused_batch_call ) {
					return new FulfilledPromise(
						new Response(
							403,
							array(),
							wp_json_encode(
								array(
									'error' => array(
										'code'    => 403,
										'message' => 'User does not have sufficient permissions for this property.',
										'errors'  => array(
											array(
												'message' => 'User does not have sufficient permissions for this property.',
												'domain'  => 'global',
												'reason'  => 'forbidden',
											),
										),
										'status'  => 'PERMISSION_DENIED',
									),
								)
							)
						)
					);
				}

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						wp_json_encode(
							array(
								'kind'    => 'analyticsData#batchRunReports',
								'reports' => array_map(
									fn( $report_request ) => $this->build_report( $report_request ),
									$batch_request['requests']
								),
							)
						)
					)
				);
			}
		);

		$this->custom_dimensions_data_available = new Custom_Dimensions_Data_Available( new Transients( $context ) );
		$this->builder                          = new Response_Builder( $analytics, $this->custom_dimensions_data_available );
	}

	/**
	 * Builds the report the fake Analytics API returns for one report request,
	 * from the rows in `$report_rows` for the report's first dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report_request The report request, as the batch call sent it.
	 * @return array The report, in the shape Analytics returns it.
	 */
	private function build_report( array $report_request ) {
		$dimension_names = array_column( $report_request['dimensions'], 'name' );

		// Analytics adds a `dateRange` dimension to a report with two periods.
		if ( count( $report_request['dateRanges'] ) > 1 ) {
			$dimension_names[] = 'dateRange';
		}

		$report = array(
			'dimensionHeaders' => array_map(
				fn( $dimension_name ) => array( 'name' => $dimension_name ),
				$dimension_names
			),
			'metricHeaders'    => array(
				array(
					'name' => 'totalUsers',
					'type' => 'TYPE_INTEGER',
				),
			),
		);

		$rows = array_map(
			fn( $row ) => array(
				'dimensionValues' => array_map(
					fn( $dimension_value ) => array( 'value' => $dimension_value ),
					array_slice( $row, 0, -1 )
				),
				'metricValues'    => array(
					array( 'value' => (string) $row[ count( $row ) - 1 ] ),
				),
			),
			$this->report_rows[ $dimension_names[0] ] ?? array()
		);

		// Analytics omits the `rows` key from a report with no rows.
		if ( ! empty( $rows ) ) {
			$report['rows'] = $rows;
		}

		return $report;
	}

	/**
	 * Gets the dimensions of each report `Response_Builder` asked for, grouped by
	 * batch call.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of batch calls, each a list of reports, each a list of dimension names.
	 */
	private function get_requested_dimensions() {
		return array_map(
			fn( $batch_request ) => array_map(
				fn( $report_request ) => array_column( $report_request['dimensions'], 'name' ),
				$batch_request['requests']
			),
			$this->batch_requests
		);
	}

	/**
	 * Makes the fake Analytics API return rows for all seven reports, so each of
	 * the six dimensions keeps at least one row.
	 *
	 * Two channels score the same, two pages score the same, and the `DEVICES`
	 * and `VISITOR_MIX` sums are equal.
	 *
	 * @since n.e.x.t
	 */
	private function provide_reports_for_every_dimension() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );

		$this->report_rows = array(
			'date'                                      => array(
				array( '20250817', 121 ),
				array( '20250819', 147 ),
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'sessionDefaultChannelGrouping'             => array(
				array( 'Organic Search', 'date_range_0', 210 ),
				array( 'Direct', 'date_range_0', 118 ),
				array( 'Referral', 'date_range_0', 47 ),
				array( 'Email', 'date_range_0', 42 ),
				array( 'Affiliates', 'date_range_0', 30 ),
				array( 'Display', 'date_range_0', 30 ),
				array( 'Direct', 'date_range_1', 137 ),
				array( 'Organic Search', 'date_range_1', 168 ),
				array( 'Email', 'date_range_1', 40 ),
				array( 'Affiliates', 'date_range_1', 10 ),
				array( 'Display', 'date_range_1', 10 ),
			),
			'deviceCategory'                            => array(
				array( 'mobile', 'date_range_0', 240 ),
				array( 'mobile', 'date_range_1', 200 ),
			),
			'newVsReturning'                            => array(
				array( 'new', 'date_range_0', 240 ),
				array( 'new', 'date_range_1', 200 ),
			),
			'sessionSource'                             => array(
				array( 'a.example.com', 'date_range_0', 80 ),
				array( 'b.example.com', 'date_range_0', 70 ),
				array( 'c.example.com', 'date_range_0', 60 ),
				array( 'd.example.com', 'date_range_0', 50 ),
				array( 'e.example.com', 'date_range_0', 45 ),
				array( 'f.example.com', 'date_range_0', 40 ),
				array( 'g.example.com', 'date_range_0', 35 ),
				array( 'a.example.com', 'date_range_1', 20 ),
				array( 'b.example.com', 'date_range_1', 20 ),
				array( 'c.example.com', 'date_range_1', 20 ),
				array( 'd.example.com', 'date_range_1', 20 ),
				array( 'e.example.com', 'date_range_1', 20 ),
				array( 'f.example.com', 'date_range_1', 20 ),
				array( 'g.example.com', 'date_range_1', 20 ),
			),
			'pagePath'                                  => array(
				array( '/b-post/', 'B post', '20260901', 'date_range_0', 30 ),
				array( '/a-post/', 'A post', '20260901', 'date_range_0', 30 ),
				array( '/b-post/', 'B post', '20260901', 'date_range_1', 10 ),
				array( '/a-post/', 'A post', '20260901', 'date_range_1', 10 ),
			),
			'customEvent:googlesitekit_post_categories' => array(
				array( 'Garden', 'date_range_0', 60 ),
				array( 'Recipes', 'date_range_0', 15 ),
				array( 'Garden', 'date_range_1', 20 ),
				array( 'Recipes', 'date_range_1', 30 ),
			),
		);
	}

	public function test_build__returns_the_error_of_the_first_batch_call_without_making_the_second() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );

		$this->refused_batch_call = 1;

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertWPError( $response, 'The `build()` method should return an error when the first batch call fails.' );
		$this->assertSame( 403, $response->get_error_code(), 'The error should have the `403` code the Analytics 4 module returned for the failed batch call.' );
		$this->assertSame( 'User does not have sufficient permissions for this property.', $response->get_error_message(), 'The error should have the message Analytics returned.' );
		$this->assertSame(
			array(
				'status' => 403,
				'reason' => 'forbidden',
			),
			$response->get_error_data(),
			'The error should have the status and the reason Analytics returned.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should not make the second batch call after the first one fails.' );
	}

	public function test_build__returns_the_error_of_the_second_batch_call() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );

		$this->refused_batch_call = 2;

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertWPError( $response, 'The `build()` method should return an error when the second batch call fails.' );
		$this->assertSame( 403, $response->get_error_code(), 'The error should have the `403` code the Analytics 4 module returned for the failed batch call.' );
		$this->assertCount( 2, $this->batch_requests, 'The `build()` method should make the second batch call after the first one succeeds.' );
	}

	public function test_build__asks_for_seven_reports_in_two_calls_when_the_post_date_and_the_post_categories_have_data() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );

		$this->report_rows = array(
			'date'                                      => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'sessionDefaultChannelGrouping'             => array(
				array( 'Referral', 'date_range_0', 47 ),
			),
			'pagePath'                                  => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
			),
			'customEvent:googlesitekit_post_categories' => array(
				array( 'Garden', 'date_range_0', 60 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					array( 'date' ),
					array( 'sessionDefaultChannelGrouping' ),
					array( 'deviceCategory' ),
					array( 'newVsReturning' ),
					array( 'sessionSource' ),
				),
				array(
					array( 'pagePath', 'pageTitle', 'customEvent:googlesitekit_post_date' ),
					array( 'customEvent:googlesitekit_post_categories' ),
				),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for five reports in the first call, and for the content and category reports in a second call.'
		);
		$this->assertSame( array( 'channels', 'content', 'categories' ), array_keys( $response['contextualData'] ), 'The response should have rows from the channel, content, and category reports.' );
	}

	public function test_build__asks_for_the_content_report_without_the_categories_report_when_only_the_post_date_has_data() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'                                      => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'sessionDefaultChannelGrouping'             => array(
				array( 'Referral', 'date_range_0', 47 ),
			),
			'pagePath'                                  => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
			),
			'customEvent:googlesitekit_post_categories' => array(
				array( 'Garden', 'date_range_0', 60 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					array( 'date' ),
					array( 'sessionDefaultChannelGrouping' ),
					array( 'deviceCategory' ),
					array( 'newVsReturning' ),
					array( 'sessionSource' ),
				),
				array(
					array( 'pagePath', 'pageTitle', 'customEvent:googlesitekit_post_date' ),
				),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for the content report in a second call, without a category report.'
		);
		$this->assertSame( array( 'channels', 'content' ), array_keys( $response['contextualData'] ), 'The response should have no `categories` rows while the post categories have no data.' );
	}

	public function test_build__asks_for_the_categories_report_without_the_content_report_when_only_the_post_categories_have_data() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );

		$this->report_rows = array(
			'date'                                      => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'sessionDefaultChannelGrouping'             => array(
				array( 'Referral', 'date_range_0', 47 ),
			),
			'pagePath'                                  => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
			),
			'customEvent:googlesitekit_post_categories' => array(
				array( 'Garden', 'date_range_0', 60 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					array( 'date' ),
					array( 'sessionDefaultChannelGrouping' ),
					array( 'deviceCategory' ),
					array( 'newVsReturning' ),
					array( 'sessionSource' ),
				),
				array(
					array( 'customEvent:googlesitekit_post_categories' ),
				),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for the category report in a second call, without a content report.'
		);
		$this->assertSame( array( 'channels', 'categories' ), array_keys( $response['contextualData'] ), 'The response should have no `content` rows while the post date has no data.' );
	}

	public function test_build__asks_for_five_reports_in_one_call_when_neither_the_post_date_nor_the_post_categories_have_data() {
		$this->report_rows = array(
			'date'                                      => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'sessionDefaultChannelGrouping'             => array(
				array( 'Referral', 'date_range_0', 47 ),
			),
			'pagePath'                                  => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
			),
			'customEvent:googlesitekit_post_categories' => array(
				array( 'Garden', 'date_range_0', 60 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					array( 'date' ),
					array( 'sessionDefaultChannelGrouping' ),
					array( 'deviceCategory' ),
					array( 'newVsReturning' ),
					array( 'sessionSource' ),
				),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for five reports in one call.'
		);
		$this->assertSame( array( 'channels' ), array_keys( $response['contextualData'] ), 'The response should have no `content` and no `categories` rows while neither the post date nor the post categories have data.' );
	}

	public function test_build__asks_for_the_daily_series_over_the_395_days_ending_on_the_end_date() {
		$this->builder->build( '2026-08-19', '2026-09-15' );

		// `assertEquals()` ignores that the Google API client writes `endDate`
		// before `startDate`.
		$this->assertEquals(
			array(
				array(
					'startDate' => '2025-08-17',
					'endDate'   => '2026-09-15',
				),
			),
			$this->batch_requests[0]['requests'][0]['dateRanges'],
			'The `build()` method should ask for the daily series over the 395 days from `2025-08-17` to `2026-09-15`.'
		);
	}

	public function test_build__asks_for_each_dimension_report_over_the_selected_period_and_the_28_days_before_it() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$date_ranges = array_map(
			fn( $report_request ) => $report_request['dateRanges'],
			array_slice( array_merge( $this->batch_requests[0]['requests'], $this->batch_requests[1]['requests'] ), 1 )
		);

		// `assertEquals()` ignores that the Google API client writes `endDate`
		// before `startDate`.
		$this->assertEquals(
			array_fill(
				0,
				6,
				array(
					array(
						'startDate' => '2026-08-19',
						'endDate'   => '2026-09-15',
					),
					array(
						'startDate' => '2026-07-22',
						'endDate'   => '2026-08-18',
					),
				)
			),
			$date_ranges,
			'The `build()` method should ask for each of the six dimension reports over `2026-08-19` to `2026-09-15`, then `2026-07-22` to `2026-08-18`, in one request.'
		);
	}

	public function test_build__lists_0_visitors_for_a_day_analytics_returned_no_row_for() {
		$this->report_rows = array(
			'date' => array(
				array( '20250817', 121 ),
				array( '20250819', 147 ),
			),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		$this->assertSame(
			array(
				array(
					'date'     => '2025-08-17',
					'visitors' => 121,
				),
				array(
					'date'     => '2025-08-18',
					'visitors' => 0,
				),
				array(
					'date'     => '2025-08-19',
					'visitors' => 147,
				),
			),
			array_slice( $daily_traffic, 0, 3 ),
			'`dailyTraffic` should list 0 visitors for `2025-08-18`, and keep `2025-08-19` as the third day.'
		);
	}

	public function test_build__lists_all_395_days_ending_on_the_end_date_oldest_first() {
		$this->report_rows = array(
			'date' => array(
				array( '20250817', 121 ),
				array( '20250819', 147 ),
			),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];
		$dates         = array_column( $daily_traffic, 'date' );
		$sorted_dates  = $dates;
		sort( $sorted_dates );

		$this->assertSame( '2025-08-17', $dates[0], '`dailyTraffic` should start on `2025-08-17`.' );
		$this->assertSame( '2026-09-15', $dates[394], '`dailyTraffic` should end on `2026-09-15`.' );
		$this->assertCount( 395, array_unique( $dates ), '`dailyTraffic` should have 395 different dates.' );
		$this->assertSame( $sorted_dates, $dates, '`dailyTraffic` should list its dates oldest first.' );
	}

	public function test_build__sums_the_visitors_of_each_period_from_the_daily_series() {
		$this->report_rows = array(
			'date' => array(
				array( '20250817', 99 ),
				array( '20260721', 1000 ),
				array( '20260722', 5 ),
				array( '20260818', 7 ),
				array( '20260819', 10 ),
				array( '20260915', 20 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				'current'  => 30,
				'previous' => 12,
			),
			$response['visitors'],
			'`visitors` should add up the days from `2026-08-19` to `2026-09-15`, and from `2026-07-22` to `2026-08-18`.'
		);
	}

	public function test_build__pairs_each_channel_across_the_two_periods_by_its_name() {
		$this->report_rows = array(
			'date'                          => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'sessionDefaultChannelGrouping' => array(
				array( 'Organic Search', 'date_range_0', 210 ),
				array( 'Direct', 'date_range_0', 118 ),
				array( 'Referral', 'date_range_0', 47 ),
				array( 'Email', 'date_range_0', 42 ),
				array( 'Direct', 'date_range_1', 137 ),
				array( 'Organic Search', 'date_range_1', 168 ),
				array( 'Email', 'date_range_1', 40 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					'label'    => 'Referral',
					'current'  => 47,
					'previous' => 0,
				),
				array(
					'label'    => 'Organic Search',
					'current'  => 210,
					'previous' => 168,
				),
				array(
					'label'    => 'Direct',
					'current'  => 118,
					'previous' => 137,
				),
			),
			$response['contextualData']['channels'],
			'`channels` should pair each channel by name, list 0 visitors for `Referral` in the compare period, exclude `Email`, and rank the rest by score.'
		);
		$this->assertSame( array( 'CHANNELS' ), $response['dimensions'], '`dimensions` should list `CHANNELS` alone.' );
	}

	public function test_build__lists_0_visitors_for_a_channel_missing_from_the_selected_period() {
		$this->report_rows = array(
			'date'                          => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'sessionDefaultChannelGrouping' => array(
				array( 'Paid Social', 'date_range_1', 60 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					'label'    => 'Paid Social',
					'current'  => 0,
					'previous' => 60,
				),
			),
			$response['contextualData']['channels'],
			'`channels` should list 0 visitors for `Paid Social` in the selected period.'
		);
	}

	public function test_build__builds_a_content_row_for_each_post_with_its_age() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'     => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'pagePath' => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
				array( '/mulching-in-autumn/', 'Mulching in autumn', '20260912', 'date_range_0', 40 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					'url'              => '/how-to-plant-garlic/',
					'title'            => 'How to plant garlic',
					'visitors'         => 96,
					'publishedDaysAgo' => 14,
				),
				array(
					'url'              => '/mulching-in-autumn/',
					'title'            => 'Mulching in autumn',
					'visitors'         => 40,
					'publishedDaysAgo' => 3,
				),
			),
			$response['contextualData']['content'],
			'`content` should have each post with its path, its title, its visitors in the selected period, and its days from publication to `2026-09-15`.'
		);
		$this->assertSame( array( 'CONTENT' ), $response['dimensions'], '`dimensions` should list `CONTENT` alone.' );
	}

	public function test_build__lists_a_post_once_with_the_title_of_its_first_row_in_the_selected_period() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'     => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'pagePath' => array(
				array( '/growing-tomatoes/', 'Growing tomatoes in pots', '20260801', 'date_range_1', 20 ),
				array( '/growing-tomatoes/', 'Growing tomatoes', '20260801', 'date_range_0', 30 ),
				array( '/growing-tomatoes/', 'Growing tomatoes in pots', '20260801', 'date_range_0', 6 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					'url'              => '/growing-tomatoes/',
					'title'            => 'Growing tomatoes',
					'visitors'         => 36,
					'publishedDaysAgo' => 45,
				),
			),
			$response['contextualData']['content'],
			'`content` should list the post once, with the title of its first row in the selected period, `Growing tomatoes`, and the visitors of its two rows in the selected period added together.'
		);
	}

	public function test_build__does_not_list_a_row_whose_post_date_is_not_a_date() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'     => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			// Analytics groups the less common values of a report with many values
			// into a row labeled `(other)`.
			'pagePath' => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
				array( '(other)', '(other)', '(other)', 'date_range_0', 80 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( '/how-to-plant-garlic/' ),
			array_column( $response['contextualData']['content'], 'url' ),
			"`content` should not list the `(other)` row, whose post date isn't a date."
		);
	}

	public function test_build__does_not_list_a_post_dated_on_a_day_that_does_not_exist() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'     => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'pagePath' => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
				array( '/spring-planting/', 'Spring planting', '20260231', 'date_range_0', 70 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( '/how-to-plant-garlic/' ),
			array_column( $response['contextualData']['content'], 'url' ),
			'`content` should not list `/spring-planting/`, whose post date `20260231` is 31 February.'
		);
	}

	public function test_build__reports_a_post_dated_after_the_end_date_as_published_0_days_ago() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'     => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			'pagePath' => array(
				array( '/harvest-notes/', 'Harvest notes', '20260916', 'date_range_0', 50 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( 0, $response['contextualData']['content'][0]['publishedDaysAgo'], 'A post dated `2026-09-16` should be reported as published 0 days before `2026-09-15`.' );
	}

	public function test_build__ranks_rows_and_dimensions_the_same_way_when_every_report_returns_its_rows_in_reverse_order() {
		$this->provide_reports_for_every_dimension();

		$first_response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->report_rows = array_map( 'array_reverse', $this->report_rows );

		$second_response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertCount( 6, $first_response['dimensions'], 'The response should list the six dimensions whose reports have rows.' );
		$this->assertSame( $first_response, $second_response, 'The `build()` method should return the same response when every report returns its rows in the reverse order.' );
	}

	public function test_build__does_not_return_a_number_with_decimals() {
		$this->provide_reports_for_every_dimension();

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$decimals = array();
		array_walk_recursive(
			$response,
			function ( $value ) use ( &$decimals ) {
				if ( is_float( $value ) ) {
					$decimals[] = $value;
				}
			}
		);

		$this->assertSame( array(), $decimals, 'The response should have no number with decimals.' );
	}

	public function test_build__does_not_save_anything_to_the_site() {
		global $wpdb;

		$this->provide_reports_for_every_dimension();

		// WordPress stores a transient in the `options` table when the site has no
		// persistent object cache.
		$options_before   = $wpdb->get_results( "SELECT option_name, option_value FROM $wpdb->options ORDER BY option_name", ARRAY_A );
		$post_meta_before = $wpdb->get_results( "SELECT post_id, meta_key, meta_value FROM $wpdb->postmeta ORDER BY meta_id", ARRAY_A );
		$user_meta_before = $wpdb->get_results( "SELECT user_id, meta_key, meta_value FROM $wpdb->usermeta ORDER BY umeta_id", ARRAY_A );

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			$options_before,
			$wpdb->get_results( "SELECT option_name, option_value FROM $wpdb->options ORDER BY option_name", ARRAY_A ),
			'The `build()` method should add or change no option and no transient.'
		);
		$this->assertSame(
			$post_meta_before,
			$wpdb->get_results( "SELECT post_id, meta_key, meta_value FROM $wpdb->postmeta ORDER BY meta_id", ARRAY_A ),
			'The `build()` method should add or change no post meta.'
		);
		$this->assertSame(
			$user_meta_before,
			$wpdb->get_results( "SELECT user_id, meta_key, meta_value FROM $wpdb->usermeta ORDER BY umeta_id", ARRAY_A ),
			'The `build()` method should add or change no user meta.'
		);
	}

	public function test_build__asks_analytics_for_the_reports_again_on_every_call() {
		$this->builder->build( '2026-08-19', '2026-09-15' );
		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertCount( 2, $this->batch_requests, 'The second `build()` call should make its own batch call rather than reuse the first response.' );
	}

	public function test_rank_contextual_data__keeps_the_5_highest_scoring_rows_of_a_dimension() {
		$ranked_data = $this->builder->rank_contextual_data(
			array(
				'referrers' => array(
					array(
						'label'    => 'g.example.com',
						'current'  => 240,
						'previous' => 200,
					),
					array(
						'label'    => 'c.example.com',
						'current'  => 280,
						'previous' => 200,
					),
					array(
						'label'    => 'a.example.com',
						'current'  => 300,
						'previous' => 200,
					),
					array(
						'label'    => 'f.example.com',
						'current'  => 250,
						'previous' => 200,
					),
					array(
						'label'    => 'b.example.com',
						'current'  => 290,
						'previous' => 200,
					),
					array(
						'label'    => 'e.example.com',
						'current'  => 260,
						'previous' => 200,
					),
					array(
						'label'    => 'd.example.com',
						'current'  => 270,
						'previous' => 200,
					),
				),
			),
			array(
				'current'  => 1000,
				'previous' => 800,
			)
		);

		$this->assertSame(
			array( 'a.example.com', 'b.example.com', 'c.example.com', 'd.example.com', 'e.example.com' ),
			array_column( $ranked_data['contextualData']['referrers'], 'label' ),
			'`referrers` should keep its 5 highest-scoring rows, highest first, without `f.example.com` and `g.example.com`.'
		);
	}

	public function test_rank_contextual_data__does_not_list_a_dimension_whose_rows_were_all_excluded() {
		$ranked_data = $this->builder->rank_contextual_data(
			array(
				'channels' => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 300,
						'previous' => 200,
					),
				),
				// `Row_Scorer` excludes `desktop` for a change under 5 visitors, and
				// `mobile` for a change under 5 percentage points from the site's 25%.
				'devices'  => array(
					array(
						'label'    => 'desktop',
						'current'  => 102,
						'previous' => 100,
					),
					array(
						'label'    => 'mobile',
						'current'  => 128,
						'previous' => 100,
					),
				),
			),
			array(
				'current'  => 1000,
				'previous' => 800,
			)
		);

		$this->assertSame( array( 'CHANNELS' ), $ranked_data['dimensions'], '`dimensions` should not list `DEVICES` once every device row is excluded.' );
		$this->assertSame( array( 'channels' ), array_keys( $ranked_data['contextualData'] ), '`contextualData` should have no `devices` key once every device row is excluded.' );
	}

	public function test_rank_contextual_data__orders_the_dimensions_by_the_sum_of_their_row_scores() {
		$ranked_data = $this->builder->rank_contextual_data(
			array(
				'channels'   => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 300,
						'previous' => 200,
					),
					array(
						'label'    => 'Direct',
						'current'  => 250,
						'previous' => 200,
					),
				),
				'content'    => array(
					array(
						'url'              => '/how-to-plant-garlic/',
						'title'            => 'How to plant garlic',
						'publishedDaysAgo' => 14,
						'current'          => 300,
						'previous'         => 200,
					),
				),
				'categories' => array(
					array(
						'label'    => 'Garden',
						'current'  => 250,
						'previous' => 200,
					),
				),
				'referrers'  => array(
					array(
						'label'    => 'news.example.com',
						'current'  => 400,
						'previous' => 200,
					),
				),
			),
			array(
				'current'  => 1000,
				'previous' => 800,
			)
		);

		$this->assertSame(
			array( 'REFERRERS', 'CHANNELS', 'CONTENT', 'CATEGORIES' ),
			$ranked_data['dimensions'],
			'`dimensions` should list `CHANNELS`, whose two rows score 15.125 together, before `CONTENT`, whose one row scores 15.'
		);
	}

	public function test_rank_contextual_data__lists_the_dimension_with_the_higher_weight_first_when_the_rows_of_two_dimensions_have_the_same_visitors() {
		$ranked_data = $this->builder->rank_contextual_data(
			array(
				'channels' => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 300,
						'previous' => 200,
					),
				),
				'content'  => array(
					array(
						'url'              => '/how-to-plant-garlic/',
						'title'            => 'How to plant garlic',
						'publishedDaysAgo' => 14,
						'current'          => 300,
						'previous'         => 200,
					),
				),
			),
			array(
				'current'  => 1000,
				'previous' => 800,
			)
		);

		$this->assertSame(
			array( 'CONTENT', 'CHANNELS' ),
			$ranked_data['dimensions'],
			'`dimensions` should list `CONTENT` before `CHANNELS`, since a `CONTENT` row is weighted by 1.5 and a `CHANNELS` row with the same visitors by 1.1.'
		);
	}

	public function test_rank_contextual_data__counts_the_rows_after_the_first_5_toward_the_sum_of_their_dimension() {
		$ranked_data = $this->builder->rank_contextual_data(
			array(
				// The content row scores 52.5.
				'content'   => array(
					array(
						'url'              => '/how-to-plant-garlic/',
						'title'            => 'How to plant garlic',
						'publishedDaysAgo' => 14,
						'current'          => 500,
						'previous'         => 200,
					),
				),
				// The 5 highest referrer rows score 48.75 together, and all 7 score
				// 58.175.
				'referrers' => array(
					array(
						'label'    => 'a.example.com',
						'current'  => 300,
						'previous' => 200,
					),
					array(
						'label'    => 'b.example.com',
						'current'  => 290,
						'previous' => 200,
					),
					array(
						'label'    => 'c.example.com',
						'current'  => 280,
						'previous' => 200,
					),
					array(
						'label'    => 'd.example.com',
						'current'  => 270,
						'previous' => 200,
					),
					array(
						'label'    => 'e.example.com',
						'current'  => 260,
						'previous' => 200,
					),
					array(
						'label'    => 'f.example.com',
						'current'  => 250,
						'previous' => 200,
					),
					array(
						'label'    => 'g.example.com',
						'current'  => 240,
						'previous' => 200,
					),
				),
			),
			array(
				'current'  => 1000,
				'previous' => 800,
			)
		);

		$this->assertSame( array( 'REFERRERS', 'CONTENT' ), $ranked_data['dimensions'], '`dimensions` should list `REFERRERS` first, because its sum counts the 2 rows after the first 5.' );
		$this->assertCount( 5, $ranked_data['contextualData']['referrers'], '`referrers` should keep 5 rows.' );
	}

	public function test_rank_contextual_data__orders_two_rows_with_the_same_score_by_label() {
		$visitors = array(
			'current'  => 1000,
			'previous' => 800,
		);
		$email    = array(
			'label'    => 'Email',
			'current'  => 300,
			'previous' => 200,
		);
		$direct   = array(
			'label'    => 'Direct',
			'current'  => 300,
			'previous' => 200,
		);

		$email_first  = $this->builder->rank_contextual_data( array( 'channels' => array( $email, $direct ) ), $visitors );
		$direct_first = $this->builder->rank_contextual_data( array( 'channels' => array( $direct, $email ) ), $visitors );

		$this->assertSame( array( 'Direct', 'Email' ), array_column( $email_first['contextualData']['channels'], 'label' ), '`Direct` should come before `Email` when the two score the same.' );
		$this->assertSame( $email_first, $direct_first, 'Two rows with the same score should come back in the same order, no matter which one `rank_contextual_data()` receives first.' );
	}

	public function test_rank_contextual_data__orders_two_content_rows_with_the_same_score_by_url() {
		// By title, `/b-post/` is first, so only the URLs can put `/a-post/` first.
		$ranked_data = $this->builder->rank_contextual_data(
			array(
				'content' => array(
					array(
						'url'              => '/b-post/',
						'title'            => 'Autumn mulching',
						'publishedDaysAgo' => 14,
						'current'          => 300,
						'previous'         => 200,
					),
					array(
						'url'              => '/a-post/',
						'title'            => 'Winter pruning',
						'publishedDaysAgo' => 14,
						'current'          => 300,
						'previous'         => 200,
					),
				),
			),
			array(
				'current'  => 1000,
				'previous' => 800,
			)
		);

		$this->assertSame(
			array(
				array(
					'url'              => '/a-post/',
					'title'            => 'Winter pruning',
					'visitors'         => 300,
					'publishedDaysAgo' => 14,
				),
				array(
					'url'              => '/b-post/',
					'title'            => 'Autumn mulching',
					'visitors'         => 300,
					'publishedDaysAgo' => 14,
				),
			),
			$ranked_data['contextualData']['content'],
			'`/a-post/` should come before `/b-post/` when the two score the same, and each row should report its current visitors as `visitors`.'
		);
	}

	public function test_rank_contextual_data__lists_two_dimensions_with_the_same_sum_in_a_fixed_order() {
		// Dimensions with the same sum are ordered by
		// `Wire_Format::DIMENSION_INDEXES`, which has `DEVICES` before `VISITOR_MIX`.
		$visitors    = array(
			'current'  => 1000,
			'previous' => 800,
		);
		$visitor_mix = array(
			array(
				'label'    => 'returning',
				'current'  => 300,
				'previous' => 200,
			),
		);
		$devices     = array(
			array(
				'label'    => 'mobile',
				'current'  => 300,
				'previous' => 200,
			),
		);

		$visitor_mix_first = $this->builder->rank_contextual_data(
			array(
				'visitorMix' => $visitor_mix,
				'devices'    => $devices,
			),
			$visitors
		);
		$devices_first     = $this->builder->rank_contextual_data(
			array(
				'devices'    => $devices,
				'visitorMix' => $visitor_mix,
			),
			$visitors
		);

		$this->assertSame( array( 'DEVICES', 'VISITOR_MIX' ), $visitor_mix_first['dimensions'], '`DEVICES` should come before `VISITOR_MIX` when their rows score the same.' );
		$this->assertSame( array( 'DEVICES', 'VISITOR_MIX' ), $devices_first['dimensions'], '`DEVICES` should come before `VISITOR_MIX` no matter which one `rank_contextual_data()` receives first.' );
	}

	public function test_rank_contextual_data__ranks_search_query_rows_and_keeps_5_like_the_rows_of_any_other_dimension() {
		$ranked_data = $this->builder->rank_contextual_data(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'mulching leaves',
						'current'          => 260,
						'previous'         => 200,
						'positionCurrent'  => 6.2,
						'positionPrevious' => 7.1,
					),
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 200,
						'positionCurrent'  => 3.4,
						'positionPrevious' => 4.8,
					),
					array(
						'label'            => 'compost bin',
						'current'          => 202,
						'previous'         => 200,
						'positionCurrent'  => 9.0,
						'positionPrevious' => 9.0,
					),
					array(
						'label'            => 'raised beds',
						'current'          => 280,
						'previous'         => 200,
						'positionCurrent'  => 5.0,
						'positionPrevious' => 5.5,
					),
					array(
						'label'            => 'seed trays',
						'current'          => 250,
						'previous'         => 200,
						'positionCurrent'  => 8.0,
						'positionPrevious' => 8.2,
					),
					array(
						'label'            => 'garden tools',
						'current'          => 290,
						'previous'         => 200,
						'positionCurrent'  => 2.5,
						'positionPrevious' => 3.1,
					),
					array(
						'label'            => 'pruning roses',
						'current'          => 270,
						'previous'         => 200,
						'positionCurrent'  => 4.0,
						'positionPrevious' => 6.0,
					),
				),
				'channels'      => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 400,
						'previous' => 200,
					),
				),
			),
			array(
				'current'  => 1000,
				'previous' => 800,
			)
		);

		$this->assertSame(
			array(
				array(
					'label'            => 'plant garlic',
					'current'          => 300,
					'previous'         => 200,
					'positionCurrent'  => 3.4,
					'positionPrevious' => 4.8,
				),
				array(
					'label'            => 'garden tools',
					'current'          => 290,
					'previous'         => 200,
					'positionCurrent'  => 2.5,
					'positionPrevious' => 3.1,
				),
				array(
					'label'            => 'raised beds',
					'current'          => 280,
					'previous'         => 200,
					'positionCurrent'  => 5.0,
					'positionPrevious' => 5.5,
				),
				array(
					'label'            => 'pruning roses',
					'current'          => 270,
					'previous'         => 200,
					'positionCurrent'  => 4.0,
					'positionPrevious' => 6.0,
				),
				array(
					'label'            => 'mulching leaves',
					'current'          => 260,
					'previous'         => 200,
					'positionCurrent'  => 6.2,
					'positionPrevious' => 7.1,
				),
			),
			$ranked_data['contextualData']['searchQueries'],
			'`searchQueries` should exclude `compost bin`, which changed by 2 clicks, and keep the 5 highest-scoring of the rest, highest first.'
		);
		$this->assertSame( array( 'SEARCH_QUERIES', 'CHANNELS' ), $ranked_data['dimensions'], '`dimensions` should list `SEARCH_QUERIES` first, since its row scores add up to 57.75 against 24.75 for `CHANNELS`.' );
	}
}
