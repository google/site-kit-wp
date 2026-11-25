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

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use DateTimeImmutable;
use DateTimeZone;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Period_Baseline;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\Fake_Benchmarking_Reports_Trait;
use Google\Site_Kit\Tests\Saved_Site_Data_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Analytics_4
 */
class Response_BuilderTest extends TestCase {

	use Fake_Benchmarking_Reports_Trait;
	use Saved_Site_Data_Trait;

	/**
	 * The dimensions of each breakdown report, joined by commas, as the fake
	 * Analytics API keys its rows. A report filtered on a key factor card's
	 * driver is keyed with `driver:` before its dimensions.
	 */
	const CHANNEL_BREAKDOWNS = 'sessionDefaultChannelGrouping,deviceCategory,newVsReturning';
	const CHANNEL_SOURCES    = 'sessionDefaultChannelGrouping,sessionSource';
	const CHANNEL_PAGES      = 'sessionDefaultChannelGrouping,landingPage';
	const CHANNEL_CAMPAIGNS  = 'sessionDefaultChannelGrouping,sessionCampaignName';
	const CONTENT            = 'pagePath,pageTitle,customEvent:googlesitekit_post_date';

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
	 * Analytics_4 instance the builder runs its reports with.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

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

		$analytics       = new Analytics_4( $context, $options, $user_options, $authentication );
		$this->analytics = $analytics;
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

				return new FulfilledPromise( $this->create_analytics_batch_response( $batch_request ) );
			}
		);

		$this->custom_dimensions_data_available = new Custom_Dimensions_Data_Available( new Transients( $context ) );
		$this->builder                          = new Response_Builder( $analytics, $this->custom_dimensions_data_available );
	}

	/**
	 * Builds the report the fake Analytics API returns for one report request,
	 * from the rows in `$report_rows` for the report's dimensions.
	 *
	 * The rows are keyed by the report's dimensions joined by commas, such as
	 * `self::CHANNEL_PAGES`.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Keys the rows by every dimension of the report.
	 *
	 * @param array $report_request The report request, as the batch call sent it.
	 * @return array The report, in the shape Analytics returns it.
	 */
	private function build_report( array $report_request ) {
		$dimension_names = array_column( $report_request['dimensions'], 'name' );
		$rows_key        = implode( ',', $dimension_names );

		// Analytics adds a `dateRange` dimension to a report with two periods.
		if ( count( $report_request['dateRanges'] ) > 1 ) {
			$dimension_names[] = 'dateRange';
		}

		$report = array(
			'dimensionHeaders' => array_map(
				fn( $dimension_name ) => array( 'name' => $dimension_name ),
				$dimension_names
			),
			// The report counts the one metric it asked for, such as `sessions` for
			// the daily series.
			'metricHeaders'    => array(
				array(
					'name' => $report_request['metrics'][0]['name'],
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
			$this->report_rows[ $rows_key ] ?? array()
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
	 * @since 1.190.0
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
	 * Gets the dimensions of the five reports of the first batch call: the daily
	 * series and the four channel breakdowns.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of reports, each a list of dimension names.
	 */
	private function get_first_call_dimensions() {
		return array(
			array( 'date' ),
			array( 'sessionDefaultChannelGrouping', 'deviceCategory', 'newVsReturning' ),
			array( 'sessionDefaultChannelGrouping', 'sessionSource' ),
			array( 'sessionDefaultChannelGrouping', 'landingPage' ),
			array( 'sessionDefaultChannelGrouping', 'sessionCampaignName' ),
		);
	}

	/**
	 * Builds the response, and gets the rows the Analytics reports gave the
	 * `googlesitekit_benchmarking_contextual_data` filter.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The rows, keyed by contextual data key.
	 */
	private function get_contextual_data() {
		$contextual_data = array();

		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( $rows ) use ( &$contextual_data ) {
				$contextual_data = $rows;

				return $rows;
			}
		);

		$this->builder->build( '2026-08-19', '2026-09-15' );

		return $contextual_data;
	}

	/**
	 * Makes the fake Analytics API return rows for every report of the first
	 * batch call and for the content report, on a site whose first recorded
	 * traffic is too recent for key factor cards.
	 *
	 * The devices and the visitor types add up to the channels, as the rows of
	 * one breakdown do.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Returns the rows of the four channel breakdowns in place of the channel, device, visitor mix, referrer and category reports.
	 */
	private function provide_reports_for_every_dimension() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'                   => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			self::CHANNEL_BREAKDOWNS => array(
				array( 'Organic Search', 'mobile', 'new', 'date_range_0', 210 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_0', 118 ),
				array( 'Referral', 'mobile', 'new', 'date_range_0', 47 ),
				array( 'Email', 'desktop', 'returning', 'date_range_0', 42 ),
				array( 'Affiliates', 'mobile', 'returning', 'date_range_0', 30 ),
				array( 'Display', 'desktop', 'new', 'date_range_0', 30 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_1', 137 ),
				array( 'Organic Search', 'mobile', 'new', 'date_range_1', 168 ),
				array( 'Email', 'desktop', 'returning', 'date_range_1', 40 ),
				array( 'Affiliates', 'mobile', 'returning', 'date_range_1', 10 ),
				array( 'Display', 'desktop', 'new', 'date_range_1', 10 ),
			),
			self::CHANNEL_SOURCES    => array(
				array( 'Direct', '(direct)', 'date_range_0', 118 ),
				array( 'Referral', 'a.example.com', 'date_range_0', 80 ),
				array( 'Referral', 'b.example.com', 'date_range_0', 70 ),
				array( 'Referral', 'c.example.com', 'date_range_0', 60 ),
				array( 'Referral', 'd.example.com', 'date_range_0', 50 ),
				array( 'Referral', 'e.example.com', 'date_range_0', 45 ),
				array( 'Referral', 'f.example.com', 'date_range_0', 40 ),
				array( 'Referral', 'g.example.com', 'date_range_0', 35 ),
				array( 'Direct', '(direct)', 'date_range_1', 137 ),
				array( 'Referral', 'a.example.com', 'date_range_1', 20 ),
				array( 'Referral', 'b.example.com', 'date_range_1', 20 ),
				array( 'Referral', 'c.example.com', 'date_range_1', 20 ),
				array( 'Referral', 'd.example.com', 'date_range_1', 20 ),
				array( 'Referral', 'e.example.com', 'date_range_1', 20 ),
				array( 'Referral', 'f.example.com', 'date_range_1', 20 ),
				array( 'Referral', 'g.example.com', 'date_range_1', 20 ),
			),
			self::CHANNEL_PAGES      => array(
				array( 'Organic Search', '/plant-garlic/', 'date_range_0', 120 ),
				array( 'Organic Search', '/plant-garlic/', 'date_range_1', 100 ),
			),
			self::CHANNEL_CAMPAIGNS  => array(
				array( 'Email', 'spring-sale', 'date_range_0', 42 ),
				array( 'Email', 'spring-sale', 'date_range_1', 40 ),
			),
			self::CONTENT            => array(
				array( '/b-post/', 'B post', '20260901', 'date_range_0', 30 ),
				array( '/a-post/', 'A post', '20260901', 'date_range_0', 30 ),
				array( '/b-post/', 'B post', '20260901', 'date_range_1', 10 ),
				array( '/a-post/', 'A post', '20260901', 'date_range_1', 10 ),
			),
		);
	}

	/**
	 * Makes the fake Analytics API return rows from which the key factor cards
	 * are `Organic Search` and `Direct`, on a site with recorded traffic on
	 * every day of the compare period.
	 *
	 * The site's visits rise from 700 to 980. `Organic Search` gains 200 of
	 * them, half on `/plant-garlic/`, a post published in the period, and
	 * `Direct` gains 80, all from returning visitors. The content report has
	 * the post only when the property has the post date dimension.
	 *
	 * @since n.e.x.t
	 */
	private function provide_key_factor_reports() {
		$pages = array(
			array( 'Organic Search', '/plant-garlic/', 'date_range_0', 150 ),
			array( 'Organic Search', '/plant-garlic/', 'date_range_1', 50 ),
		);

		foreach ( array( '/a/', '/b/', '/c/', '/d/', '/e/' ) as $page ) {
			$pages[] = array( 'Organic Search', $page, 'date_range_0', 90 );
			$pages[] = array( 'Organic Search', $page, 'date_range_1', 70 );
		}

		$this->report_rows = array(
			'date'                   => $this->get_daily_report_rows( '2026-07-22', '2026-09-15', fn( $position ) => $position < 28 ? 25 : 35 ),
			self::CHANNEL_BREAKDOWNS => array(
				array( 'Organic Search', 'desktop', 'returning', 'date_range_0', 600 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_0', 380 ),
				array( 'Organic Search', 'desktop', 'returning', 'date_range_1', 400 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_1', 300 ),
			),
			self::CHANNEL_PAGES      => $pages,
			self::CONTENT            => array(
				array( '/plant-garlic/', 'Plant garlic', '20260901', 'date_range_0', 150 ),
			),
		);
	}

	/**
	 * Makes the fake Analytics API return rows of a steady period, on a site
	 * with recorded traffic on every day of the compare period.
	 *
	 * The site has 700 visits in each period, and no channel moved by more than
	 * two visits, so no channel changed notably.
	 *
	 * @since n.e.x.t
	 */
	private function provide_steady_reports() {
		$this->report_rows = array(
			'date'                   => $this->get_daily_report_rows( '2026-07-22', '2026-09-15', fn() => 25 ),
			self::CHANNEL_BREAKDOWNS => array(
				array( 'Organic Search', 'desktop', 'returning', 'date_range_0', 302 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_0', 199 ),
				array( 'Referral', 'desktop', 'returning', 'date_range_0', 121 ),
				array( 'Email', 'desktop', 'returning', 'date_range_0', 78 ),
				array( 'Organic Search', 'desktop', 'returning', 'date_range_1', 300 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_1', 200 ),
				array( 'Referral', 'desktop', 'returning', 'date_range_1', 120 ),
				array( 'Email', 'desktop', 'returning', 'date_range_1', 80 ),
			),
		);
	}

	/**
	 * Gets a day for each date from one day to another, with its visits, in the
	 * shape of the daily report's rows.
	 *
	 * @since n.e.x.t
	 *
	 * @param string   $first_date The first day, as `YYYY-MM-DD`.
	 * @param string   $last_date  The last day, as `YYYY-MM-DD`.
	 * @param callable $get_visits Gets the visits of a day from its position, `0` for `$first_date`.
	 * @return array List of rows, each with the date as `YYYYMMDD`, then its visits.
	 */
	private function get_daily_report_rows( $first_date, $last_date, callable $get_visits ) {
		$utc  = new DateTimeZone( 'UTC' );
		$date = new DateTimeImmutable( $first_date, $utc );
		$last = new DateTimeImmutable( $last_date, $utc );
		$rows = array();

		while ( $date <= $last ) {
			$rows[] = array( $date->format( 'Ymd' ), $get_visits( count( $rows ) ) );
			$date   = $date->modify( '+1 day' );
		}

		return $rows;
	}

	/**
	 * Gets the bounds of each day of `dailyTraffic`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $daily_traffic The `dailyTraffic` rows.
	 * @return array List of the bounds of each day, as `array( expectedMin, expectedMax )`.
	 */
	private function get_expected_ranges( array $daily_traffic ) {
		return array_map(
			fn( $day ) => array( $day['expectedMin'], $day['expectedMax'] ),
			$daily_traffic
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
		$this->assertSame( 403, $response->get_error_code(), 'The error should have the `403` code the Analytics 4 module returned for the failed second batch call.' );
		$this->assertCount( 2, $this->batch_requests, 'The `build()` method should make the second batch call after the first one succeeds.' );
	}

	public function test_build__asks_for_six_reports_in_two_calls_when_the_post_date_has_data() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				$this->get_first_call_dimensions(),
				array(
					array( 'pagePath', 'pageTitle', 'customEvent:googlesitekit_post_date' ),
				),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for the daily series and the four channel breakdowns in the first call, and for the content report in a second call.'
		);
	}

	public function test_build__asks_for_five_reports_in_one_call_when_the_post_date_has_no_data() {
		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( $this->get_first_call_dimensions() ),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for the daily series and the four channel breakdowns in one call, without the content report.'
		);
	}

	public function test_build__does_not_ask_for_a_categories_report_when_the_post_categories_have_data() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );
		$this->analytics->get_settings()->merge(
			array( 'availableCustomDimensions' => array( 'googlesitekit_post_categories' ) )
		);

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( array( $this->get_first_call_dimensions() ), $this->get_requested_dimensions(), 'The `build()` method should ask for no report by post category, since a category is never a key factor card.' );
	}

	public function test_build__asks_for_the_content_report_when_the_property_has_the_post_date_dimension_without_recorded_data() {
		$this->analytics->get_settings()->merge(
			array( 'availableCustomDimensions' => array( 'googlesitekit_post_date' ) )
		);

		$this->report_rows = array(
			'date'        => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			self::CONTENT => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				$this->get_first_call_dimensions(),
				array(
					array( 'pagePath', 'pageTitle', 'customEvent:googlesitekit_post_date' ),
				),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for the content report when `availableCustomDimensions` lists the post date, even though Site Kit has not recorded that it has data.'
		);
		$this->assertSame( array( '2026-09-01' ), array_column( $response['contentMarkers'], 'date' ), 'The response should mark the post of the content report.' );
	}

	public function test_build__does_not_ask_for_the_content_report_when_the_property_does_not_have_the_post_date_dimension() {
		$this->analytics->get_settings()->merge(
			array( 'availableCustomDimensions' => array( 'googlesitekit_post_author', 'googlesitekit_post_type' ) )
		);

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should not ask for the content report when `availableCustomDimensions` does not list the post date.' );
	}

	public function test_build__asks_for_each_breakdown_and_the_content_report_over_the_selected_period_and_the_28_days_before_it() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

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
				5,
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
			'The `build()` method should ask for the four breakdowns and the content report over `2026-08-19` to `2026-09-15`, then `2026-07-22` to `2026-08-18`, in one request each.'
		);
	}

	public function test_build__lists_0_visits_for_a_day_analytics_returned_no_row_for() {
		$this->report_rows = array(
			'date' => array(
				array( '20260819', 121 ),
				array( '20260821', 147 ),
			),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		$this->assertSame(
			array(
				array(
					'date'        => '2026-08-19',
					'visits'      => 121,
					'expectedMin' => null,
					'expectedMax' => null,
				),
				array(
					'date'        => '2026-08-20',
					'visits'      => 0,
					'expectedMin' => null,
					'expectedMax' => null,
				),
				array(
					'date'        => '2026-08-21',
					'visits'      => 147,
					'expectedMin' => null,
					'expectedMax' => null,
				),
			),
			array_slice( $daily_traffic, 0, 3 ),
			'`dailyTraffic` should list 0 visits for `2026-08-20`, and keep `2026-08-21` as the third day. The site recorded its first visits on `2026-08-19`, too late for the period to have an expected range, so none of the three days has one.'
		);
	}

	public function test_build__lists_the_28_days_of_the_selected_period_oldest_first() {
		// The report has a row for `2026-08-18`, the last day of the compare
		// period, which `dailyTraffic` leaves out.
		$this->report_rows = array(
			'date' => array(
				array( '20260818', 388 ),
				array( '20260819', 121 ),
				array( '20260915', 412 ),
			),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];
		$dates         = array_column( $daily_traffic, 'date' );
		$sorted_dates  = $dates;
		sort( $sorted_dates );

		$this->assertCount( 28, $daily_traffic, '`dailyTraffic` should have exactly 28 rows, one for each day of the selected period.' );
		$this->assertCount( 28, array_unique( $dates ), '`dailyTraffic` should have 28 different dates.' );
		$this->assertSame(
			array(
				'date'        => '2026-08-19',
				'visits'      => 121,
				'expectedMin' => null,
				'expectedMax' => null,
			),
			$daily_traffic[0],
			'`dailyTraffic` should start on `2026-08-19`, the first day of the selected period, with its `121` visits and no expected range.'
		);
		$this->assertSame( '2026-09-15', $dates[27], '`dailyTraffic` should end on `2026-09-15`, the last day of the selected period.' );
		$this->assertSame( $sorted_dates, $dates, '`dailyTraffic` should list its dates oldest first.' );
	}

	public function test_build__ends_the_daily_traffic_on_an_end_date_of_9999_12_31() {
		$daily_traffic = $this->builder->build( '9999-12-31', '9999-12-31' )['dailyTraffic'];

		$this->assertSame(
			array(
				array(
					'date'        => '9999-12-31',
					'visits'      => 0,
					'expectedMin' => null,
					'expectedMax' => null,
				),
			),
			$daily_traffic,
			'`dailyTraffic` should list `9999-12-31` alone, the one day of the selected period, and end there.'
		);
	}

	public function test_build__asks_for_the_sessions_of_each_day_from_364_days_before_the_compare_period() {
		$this->builder->build( '2026-08-19', '2026-09-15' );

		$daily_report_request = $this->batch_requests[0]['requests'][0];

		$this->assertSame(
			array( array( 'name' => 'sessions' ) ),
			$daily_report_request['metrics'],
			'The daily report should count sessions, so the traffic line, the visit totals and the expected range count visits.'
		);
		// `assertEquals()` ignores that the Google API client writes `endDate`
		// before `startDate`.
		$this->assertEquals(
			array(
				array(
					'startDate' => '2025-07-23',
					'endDate'   => '2026-09-15',
				),
			),
			$daily_report_request['dateRanges'],
			'The daily report should run from `2025-07-23`, 364 days before the compare period starts on `2026-07-22` and 392 days before the period starts, to `2026-09-15`, so it covers last year\'s two periods and the reference of the band of the period\'s first day.'
		);
	}

	public function test_build__returns_no_insight_request_without_the_traffic_insights_feature() {
		$this->provide_reports_for_every_dimension();

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( 'visits', 'dailyTraffic', 'availability', 'bandReferenceDays', 'keyFactors', 'steadyTraffic', 'contentMarkers' ),
			array_keys( $response ),
			'Without the `trafficInsights` feature, the response should have no `insightRequest`.'
		);
	}

	public function test_build__returns_the_insight_request_built_from_the_sums_of_the_breakdowns_with_the_traffic_insights_feature() {
		$this->enable_feature( 'trafficInsights' );
		$this->provide_reports_for_every_dimension();

		// The site recorded its first visits on `2026-07-22`, the first day of
		// the compare period, so the insight is requested with the key factors.
		$this->report_rows['date'] = array(
			array( '20260722', 388 ),
			array( '20260915', 412 ),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$pair = fn( $current, $previous ) => array(
			'current'  => $current,
			'previous' => $previous,
		);

		$breakdown = fn( $channel, $device, $segment, $current, $previous ) => array(
			'channel'  => $channel,
			'device'   => $device,
			'segment'  => $segment,
			'sessions' => $pair( $current, $previous ),
		);

		// The 56 days up to the end date are too little history for an
		// expected range, and leave last year's periods out. The channels,
		// devices and visitor types are the sums of the channel breakdown, and
		// the referrers the sums of the channel and source breakdown, without
		// `(direct)`. The breakdowns themselves follow, and the most visited
		// pages are the sums of the channel and page breakdown. The
		// decomposition has a test of its own.
		$this->assertSame(
			array(
				'end_date'        => '2026-09-15',
				'days_in_period'  => 28,
				'visits'          => array(
					'current_period'  => 412,
					'previous_period' => 388,
				),
				'history_days'    => 56,
				'contextual_data' => array(
					'traffic_channel_surges'  => array(
						array(
							'channel'  => 'Organic Search',
							'sessions' => $pair( 210, 168 ),
						),
						array(
							'channel'  => 'Direct',
							'sessions' => $pair( 118, 137 ),
						),
						array(
							'channel'  => 'Referral',
							'sessions' => $pair( 47, 0 ),
						),
						array(
							'channel'  => 'Email',
							'sessions' => $pair( 42, 40 ),
						),
						array(
							'channel'  => 'Affiliates',
							'sessions' => $pair( 30, 10 ),
						),
						array(
							'channel'  => 'Display',
							'sessions' => $pair( 30, 10 ),
						),
					),
					'device_shifts'           => array(
						array(
							'device'   => 'mobile',
							'sessions' => $pair( 287, 178 ),
						),
						array(
							'device'   => 'desktop',
							'sessions' => $pair( 190, 187 ),
						),
					),
					'user_mix_shifts'         => array(
						array(
							'segment'  => 'new',
							'sessions' => $pair( 287, 178 ),
						),
						array(
							'segment'  => 'returning',
							'sessions' => $pair( 190, 187 ),
						),
					),
					'referrers'               => array_map(
						fn( $label, $current ) => array(
							'referrer' => $label,
							'sessions' => $pair( $current, 20 ),
						),
						array( 'a.example.com', 'b.example.com', 'c.example.com', 'd.example.com', 'e.example.com', 'f.example.com', 'g.example.com' ),
						array( 80, 70, 60, 50, 45, 40, 35 )
					),
					'recent_content_momentum' => array(
						array(
							'url'                => '/a-post/',
							'title'              => 'A post',
							'published_days_ago' => 14,
							'sessions'           => 30,
						),
						array(
							'url'                => '/b-post/',
							'title'              => 'B post',
							'published_days_ago' => 14,
							'sessions'           => 30,
						),
					),
					'channel_breakdowns'      => array(
						$breakdown( 'Organic Search', 'mobile', 'new', 210, 168 ),
						$breakdown( 'Direct', 'desktop', 'returning', 118, 137 ),
						$breakdown( 'Referral', 'mobile', 'new', 47, 0 ),
						$breakdown( 'Email', 'desktop', 'returning', 42, 40 ),
						$breakdown( 'Affiliates', 'mobile', 'returning', 30, 10 ),
						$breakdown( 'Display', 'desktop', 'new', 30, 10 ),
					),
					'channel_pages'           => array(
						array(
							'channel'  => 'Organic Search',
							'url'      => '/plant-garlic/',
							'sessions' => $pair( 120, 100 ),
						),
					),
					'channel_campaigns'       => array(
						array(
							'channel'  => 'Email',
							'campaign' => 'spring-sale',
							'sessions' => $pair( 42, 40 ),
						),
					),
					'top_pages'               => array(
						array(
							'url'    => '/plant-garlic/',
							'visits' => 120,
						),
					),
					'previous_top_pages'      => array(
						array(
							'url'    => '/plant-garlic/',
							'visits' => 100,
						),
					),
				),
			),
			array_diff_key( $response['insightRequest'], array( 'decomposition' => true ) ),
			'With the `trafficInsights` feature, the response should carry the insight request, built from the daily series, from the sums of the breakdowns, and from the breakdowns themselves.'
		);
	}

	public function test_build__sends_the_key_factor_cards_as_the_decomposition_of_the_insight_request() {
		$this->enable_feature( 'trafficInsights' );
		$this->provide_reports_for_every_dimension();

		$this->report_rows['date'] = array(
			array( '20260722', 388 ),
			array( '20260915', 412 ),
		);

		$response      = $this->builder->build( '2026-08-19', '2026-09-15' );
		$decomposition = $response['insightRequest']['decomposition'];

		$this->assertSame(
			array_column( $response['keyFactors'], 'label' ),
			array_column( $decomposition['key_factors'], 'title' ),
			'The decomposition should carry the key factor cards of the response, in their order.'
		);
		$this->assertSame(
			array_map( fn( $card ) => $card['current'] - $card['previous'], $response['keyFactors'] ),
			array_column( $decomposition['key_factors'], 'delta' ),
			'Each card of the decomposition should carry the change of its key factor card.'
		);

		// The channels count fewer visits in the compare period than the daily
		// series, so the cards' changes add up from the site's totals. The
		// residual is the 24 visits the site gained, less the 109 that
		// `Referral`, `Organic Search` and `Affiliates` gained.
		$this->assertSame(
			array(
				'opening_sessions' => 388,
				'closing_sessions' => 412,
				'residual_delta'   => -85,
			),
			array_intersect_key( $decomposition, array_flip( array( 'opening_sessions', 'closing_sessions', 'residual_delta' ) ) ),
			'The cards\' changes and the residual should add up to the change in the site\'s visits.'
		);
	}

	public function test_build__builds_the_insight_request_from_the_rows_a_contextual_data_callback_adds() {
		$this->enable_feature( 'trafficInsights' );
		$this->report_rows = array(
			'date' => array(
				array( '20260722', 388 ),
				array( '20260915', 412 ),
			),
		);

		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( $contextual_data ) {
				$contextual_data['searchQueries'] = array_map(
					fn( $n ) => array(
						'label'            => "query $n",
						'current'          => 100 + $n,
						'previous'         => 100,
						'positionCurrent'  => 2.5,
						'positionPrevious' => null,
					),
					range( 1, 12 )
				);

				return $contextual_data;
			}
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array_map( fn( $n ) => "query $n", range( 12, 3 ) ),
			array_column( $response['insightRequest']['contextual_data']['search_query_shifts'], 'query' ),
			'The insight request should list the 10 search queries a callback added that moved most.'
		);
		$this->assertSame(
			array(
				'current'  => 2.5,
				'previous' => 0.0,
			),
			$response['insightRequest']['contextual_data']['search_query_shifts'][0]['position'],
			'A search query should carry its positions, with `0.0` for a period it was not reported in.'
		);
	}

	public function test_build__returns_a_null_insight_request_while_the_compare_period_has_a_day_before_the_first_day_with_traffic() {
		$this->enable_feature( 'trafficInsights' );
		// The site recorded its first visits on `2026-08-18`, the last day of
		// the compare period.
		$this->provide_reports_for_every_dimension();

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( array(), $response['keyFactors'], 'There should be no key factor cards while the compare period has a day before the site was measured.' );
		$this->assertArrayHasKey( 'insightRequest', $response, 'With the `trafficInsights` feature, the response should always have `insightRequest`.' );
		$this->assertNull( $response['insightRequest'], 'The insight, whose driver describes the change the key factor cards show, should not be requested without them.' );
	}

	/**
	 * @dataProvider data_first_traffic_dates_around_the_compare_period
	 *
	 * @param string $first_date      The first day of the daily report with visits, as `YYYY-MM-DD`.
	 * @param bool   $has_the_request Whether the response should carry an insight request.
	 */
	public function test_build__requests_the_insight_once_every_day_of_the_compare_period_has_traffic( $first_date, $has_the_request ) {
		$this->enable_feature( 'trafficInsights' );
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( $first_date, '2026-09-15', fn() => 100 ),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		if ( $has_the_request ) {
			$this->assertIsArray( $response['insightRequest'], "With recorded traffic from `$first_date`, the response should carry the insight request." );
			$this->assertArrayNotHasKey( 'baseline', $response['insightRequest'], "With recorded traffic from `$first_date`, the period should have no expected range, and the request no baseline." );
		} else {
			$this->assertNull( $response['insightRequest'], "With recorded traffic from `$first_date`, the response should carry no insight request." );
		}
	}

	public function data_first_traffic_dates_around_the_compare_period() {
		// The compare period runs from `2026-07-22` to `2026-08-18`.
		return array(
			'56 days, from 2026-07-22' => array( '2026-07-22', true ),
			'55 days, from 2026-07-23' => array( '2026-07-23', false ),
		);
	}

	public function test_build__returns_a_null_insight_request_for_a_period_shorter_than_7_days() {
		$this->enable_feature( 'trafficInsights' );
		$this->provide_reports_for_every_dimension();

		$response = $this->builder->build( '2026-09-15', '2026-09-15' );

		$this->assertArrayHasKey( 'insightRequest', $response, 'With the `trafficInsights` feature, the response should always have `insightRequest`.' );
		$this->assertNull( $response['insightRequest'], 'A one-day period should have no insight request.' );
		$this->assertSame( array(), $response['keyFactors'], 'A one-day period should have no key factor cards.' );
	}

	public function test_build__returns_a_null_insight_request_when_neither_period_has_a_visit() {
		$this->enable_feature( 'trafficInsights' );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				'current'  => 0,
				'previous' => 0,
			),
			$response['visits'],
			'Without any row in the daily report, neither period should have a visit.'
		);
		$this->assertNull( $response['insightRequest'], 'Two periods without a visit should have no insight request.' );
	}

	public function test_build__gives_every_day_of_a_steady_year_the_same_expected_range() {
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( '2025-07-23', '2026-09-15', fn() => 100 ),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		// Each day's fit reads 365 days of 100 visits a day, so each day has
		// the same band, and the 28 days add up to the period's range of `2341`
		// to `3259` visits: a center of `2800` and a margin of `458.97`, which
		// the traffic-size default sets for a site whose forecasts never missed.
		$this->assertSame(
			array_fill( 0, 28, array( 83.6, 116.4 ) ),
			$this->get_expected_ranges( $daily_traffic ),
			'With 100 visits on every day of the daily report, each of the 28 days should have `83.6` to `116.4` as its expected range.'
		);
	}

	public function test_build__gives_every_day_of_a_period_longer_than_a_year_a_band_and_requests_no_insight() {
		$this->enable_feature( 'trafficInsights' );
		// The 426 days from `2025-07-17` to `2026-09-15`, the longest custom
		// range the date picker allows, after more than three years of 100
		// visits a day: the band's 509 days, and the 852 days of the period
		// and the one before it.
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( '2023-05-19', '2026-09-15', fn() => 100 ),
		);

		$response = $this->builder->build( '2025-07-17', '2026-09-15' );

		// Each day's fit reads 365 days of 100 visits a day, so each day has the
		// same band. The traffic-size default grows more slowly than the total,
		// so the margin of the 426 days' total is relatively narrower than a
		// 28-day total's, which gives each of its days `83.6` to `116.4`.
		$this->assertCount( 426, $response['dailyTraffic'], 'The daily traffic should list each of the 426 days of the period.' );
		$this->assertSame(
			array_fill( 0, 426, array( 88.7, 111.3 ) ),
			$this->get_expected_ranges( $response['dailyTraffic'] ),
			'With 100 visits on every day of the daily report, each of the 426 days should have `88.7` to `111.3` as its expected range.'
		);
		$this->assertSame(
			array(
				'current'  => 42600,
				'previous' => 42600,
			),
			$response['visits'],
			'Each of the two periods should have 426 days of 100 visits.'
		);
		$this->assertNull( $response['insightRequest'], 'A period longer than 364 days, which the service writes no insight for, should have no insight request.' );
	}

	public function test_build__gives_a_site_with_low_traffic_no_band_no_key_factor_cards_and_no_insight_request() {
		$this->enable_feature( 'trafficInsights' );
		$this->provide_key_factor_reports();
		// The 420 days from `2025-07-23` to `2026-09-15`: a year of 100 visits a
		// day, then 3 a day over the last 56 days, 168 visits in all, which is
		// under 100 per 28 days. The year gives the period the history of its
		// band, and the breakdowns would give it key factor cards.
		$this->report_rows['date'] = $this->get_daily_report_rows( '2025-07-23', '2026-09-15', fn( $position ) => $position < 364 ? 100 : 3 );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertTrue( $response['availability']['low_traffic'], 'The site should have low traffic.' );
		$this->assertSame(
			array_fill( 0, 28, array( null, null ) ),
			$this->get_expected_ranges( $response['dailyTraffic'] ),
			'No day of the period should have an expected range, so the chart draws no band.'
		);
		$this->assertNull( $response['bandReferenceDays'], 'Without a band, the response should have no days for its tooltip.' );
		$this->assertSame( array(), $response['keyFactors'], 'A site with low traffic should have no key factor cards.' );
		$this->assertFalse( $response['steadyTraffic'], 'A site with low traffic should not be steady, since it has no key factors.' );
		$this->assertNull( $response['insightRequest'], 'A site with low traffic should have no insight request.' );
	}

	public function test_build__gives_each_day_the_band_period_baseline_fits_for_the_period() {
		$get_visits        = fn( $position ) => 150 + ( $position * 37 ) % 91 - ( 0 === $position % 7 ? 60 : 0 );
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( '2025-07-23', '2026-09-15', $get_visits ),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		$daily_series = array_map(
			fn( $row ) => array(
				'date'   => DateTimeImmutable::createFromFormat( '!Ymd', $row[0], new DateTimeZone( 'UTC' ) )->format( 'Y-m-d' ),
				'visits' => $row[1],
			),
			$this->report_rows['date']
		);

		$daily_ranges = Period_Baseline::from_daily_series( $daily_series )->get_daily_ranges( '2026-09-15', 28 );

		$this->assertSame(
			array_map(
				fn( $daily_range ) => array( $daily_range['expected_min'], $daily_range['expected_max'] ),
				array_values( $daily_ranges )
			),
			$this->get_expected_ranges( $daily_traffic ),
			'Each day should have the band that `Period_Baseline` fits for it from the same daily report.'
		);
	}

	public function test_build__gives_the_selected_period_the_expected_range_of_its_insight_request() {
		$this->enable_feature( 'trafficInsights' );

		$get_visits        = fn( $position ) => 150 + ( $position * 37 ) % 91 - ( 0 === $position % 7 ? 60 : 0 );
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( '2025-08-20', '2026-09-15', $get_visits ),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );
		$baseline = $response['insightRequest']['baseline'];

		// Each day's bounds are rounded to one decimal, so the 28 days add up to
		// the range to within 1.4 visits, and the range's own bounds are rounded
		// to whole visits.
		$this->assertEqualsWithDelta(
			$baseline['expected_range_min'],
			array_sum( array_column( $response['dailyTraffic'], 'expectedMin' ) ),
			2,
			'The fewest visits of the days should add up to the fewest visits of the range the insight request sends.'
		);
		$this->assertEqualsWithDelta(
			$baseline['expected_range_max'],
			array_sum( array_column( $response['dailyTraffic'], 'expectedMax' ) ),
			2,
			'The most visits of the days should add up to the most visits of the range the insight request sends.'
		);
	}

	public function test_build__gives_a_weekday_with_fewer_visits_a_lower_expected_range() {
		// `2025-07-23` is a Wednesday, so positions 3 and 4 of each week are the
		// Saturday and the Sunday.
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows(
				'2025-07-23',
				'2026-09-15',
				fn( $position ) => in_array( $position % 7, array( 3, 4 ), true ) ? 40 : 120
			),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		foreach ( $daily_traffic as $day ) {
			$weekday = ( new DateTimeImmutable( $day['date'], new DateTimeZone( 'UTC' ) ) )->format( 'w' );

			if ( in_array( $weekday, array( '0', '6' ), true ) ) {
				$this->assertSame( array( 38.2, 53.3 ), array( $day['expectedMin'], $day['expectedMax'] ), "`{$day['date']}` is on a weekend, which has 40 visits a day, so it should have the expected range of a weekend day." );
			} else {
				$this->assertSame( array( 98.3, 137.1 ), array( $day['expectedMin'], $day['expectedMax'] ), "`{$day['date']}` is on a weekday, which has 120 visits a day, so it should have the expected range of a weekday." );
			}
		}
	}

	public function test_build__gives_a_day_with_no_visits_after_a_year_of_visits_an_expected_range() {
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( '2025-07-23', '2026-08-18', fn() => 100 ),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		$this->assertSame( '2026-08-19', $daily_traffic[0]['date'], '`dailyTraffic` should start on `2026-08-19`, and list no day of the history before it.' );
		$this->assertCount( 28, $daily_traffic, '`dailyTraffic` should list the 28 days of the selected period alone.' );

		// Each day is forecast on the year of 100 visits a day that ends 28 days
		// before it, as in the steady year above, so the period's own visits
		// don't move its band.
		foreach ( $daily_traffic as $day ) {
			$this->assertSame( 0, $day['visits'], "`{$day['date']}` should have no visits." );
			$this->assertSame( array( 83.6, 116.4 ), array( $day['expectedMin'], $day['expectedMax'] ), "`{$day['date']}` should have the expected range of a site with 100 visits a day." );
		}
	}

	/**
	 * @dataProvider data_recorded_traffic_histories
	 *
	 * @param string $first_date The first day of the daily report with visits, as `YYYY-MM-DD`.
	 * @param bool   $has_range  Whether the selected period should have an expected range.
	 */
	public function test_build__gives_the_period_an_expected_range_from_111_days_of_recorded_traffic( $first_date, $has_range ) {
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( $first_date, '2026-09-15', fn() => 100 ),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		foreach ( $daily_traffic as $day ) {
			if ( $has_range ) {
				$this->assertIsFloat( $day['expectedMin'], "With recorded traffic from `$first_date`, `{$day['date']}` should have the fewest visits of an expected range." );
				$this->assertIsFloat( $day['expectedMax'], "With recorded traffic from `$first_date`, `{$day['date']}` should have the most visits of an expected range." );
			} else {
				$this->assertSame( array( null, null ), array( $day['expectedMin'], $day['expectedMax'] ), "With recorded traffic from `$first_date`, `{$day['date']}` should have no expected range." );
			}
		}
	}

	public function data_recorded_traffic_histories() {
		// The first day of a 28-day period needs the 84 days of its own 28-day
		// fit, so the period needs 111 days.
		return array(
			'111 days, from 2026-05-28' => array( '2026-05-28', true ),
			'110 days, from 2026-05-29' => array( '2026-05-29', false ),
			'84 days, from 2026-06-24'  => array( '2026-06-24', false ),
			'46 days, from 2026-08-01'  => array( '2026-08-01', false ),
		);
	}

	/**
	 * @dataProvider data_band_reference_histories
	 *
	 * @param string|null $first_date The first day of the daily report with visits, as `YYYY-MM-DD`, or null for a report without visits.
	 * @param int|null    $expected   The days the band of the period's last day should be fitted on, or null for no band.
	 */
	public function test_build__returns_the_days_of_traffic_the_band_of_the_period_s_last_day_is_fitted_on( $first_date, $expected ) {
		$this->report_rows = array(
			'date' => null === $first_date ? array() : $this->get_daily_report_rows( $first_date, '2026-09-15', fn() => 100 ),
		);

		$this->assertSame(
			$expected,
			$this->builder->build( '2026-08-19', '2026-09-15' )['bandReferenceDays'],
			'`bandReferenceDays` should be the days before the 28 days that end on `2026-09-15`, at most 365, or null without a band.'
		);
	}

	public function data_band_reference_histories() {
		return array(
			'420 days, from 2025-07-23' => array( '2025-07-23', 365 ),
			'111 days, from 2026-05-28' => array( '2026-05-28', 83 ),
			'110 days, from 2026-05-29' => array( '2026-05-29', null ),
			'no visits'                 => array( null, null ),
		);
	}

	public function test_build__does_not_change_the_expected_range_when_the_visits_of_the_selected_period_change() {
		$get_visits        = fn( $position ) => 150 + ( $position * 37 ) % 91;
		$this->report_rows = array(
			'date' => $this->get_daily_report_rows( '2025-08-20', '2026-09-15', $get_visits ),
		);

		$daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		// The rows of the selected period, from `2026-08-19`, are the last 28.
		foreach ( array_keys( array_slice( $this->report_rows['date'], -28, null, true ) ) as $position ) {
			$this->report_rows['date'][ $position ][1] = 9999;
		}

		$changed_daily_traffic = $this->builder->build( '2026-08-19', '2026-09-15' )['dailyTraffic'];

		$this->assertSame( 9999, $changed_daily_traffic[0]['visits'], '`2026-08-19` should have the changed visits.' );
		$this->assertSame(
			$this->get_expected_ranges( $daily_traffic ),
			$this->get_expected_ranges( $changed_daily_traffic ),
			'Each day is forecast from the history up to 28 days before it, so the visits of a 28-day period should not move its band.'
		);
	}

	/**
	 * @dataProvider data_availability_histories
	 *
	 * @param array $report_rows The rows of the daily report.
	 * @param array $expected    The parts of the availability the history decides.
	 */
	public function test_build__returns_the_availability_of_the_history_from_the_first_day_of_the_daily_report_with_visits( $report_rows, $expected ) {
		$this->report_rows = array( 'date' => $report_rows );

		$availability = $this->builder->build( '2026-08-19', '2026-09-15' )['availability'];

		$this->assertSame(
			$expected,
			array_intersect_key( $availability, $expected ),
			'`availability` should count the history from the first day of the daily report with visits: the band needs 111 days of it, and the key factor cards 56.'
		);
	}

	public function data_availability_histories() {
		$get_visits = fn() => 100;

		// 46 days of history up to `2026-09-15`, too few for either part.
		$from_2026_08_01 = array(
			'band_available'             => false,
			'band_available_from'        => '2026-11-19',
			'key_factors_available'      => false,
			'key_factors_available_from' => '2026-09-25',
		);

		return array(
			'visits from `2026-08-01` on'  => array( $this->get_daily_report_rows( '2026-08-01', '2026-09-15', $get_visits ), $from_2026_08_01 ),
			'visits on every day'          => array(
				$this->get_daily_report_rows( '2025-08-20', '2026-09-15', $get_visits ),
				array(
					'band_available'             => true,
					'band_available_from'        => '2025-12-08',
					'key_factors_available'      => true,
					'key_factors_available_from' => '2025-10-14',
				),
			),
			'visits on `2026-08-01` alone' => array( array( array( '20260801', 100 ) ), $from_2026_08_01 ),
			'a day with no visits first'   => array(
				array(
					array( '20260731', 0 ),
					array( '20260801', 100 ),
				),
				$from_2026_08_01,
			),
			'no visits'                    => array(
				array(),
				array(
					'band_available'             => false,
					'band_available_from'        => null,
					'key_factors_available'      => false,
					'key_factors_available_from' => null,
				),
			),
		);
	}

	public function test_build__sums_the_visits_of_each_period_from_the_daily_series() {
		$this->report_rows = array(
			'date' => array(
				// `20250817` and `20260721` sit outside both periods, so neither
				// total counts them.
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
			$response['visits'],
			'`visits` should add up the days from `2026-08-19` to `2026-09-15`, and from `2026-07-22` to `2026-08-18`.'
		);
	}

	public function test_build__pairs_each_breakdown_row_across_the_two_periods_by_all_of_its_values() {
		$this->report_rows = array(
			self::CHANNEL_BREAKDOWNS => array(
				array( 'Organic Search', 'mobile', 'new', 'date_range_0', 210 ),
				array( 'Organic Search', 'desktop', 'new', 'date_range_0', 30 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_0', 118 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_1', 137 ),
				array( 'Organic Search', 'mobile', 'new', 'date_range_1', 168 ),
				array( 'Email', 'mobile', 'new', 'date_range_1', 40 ),
			),
		);

		$this->assertSame(
			array(
				array(
					'channel'  => 'Organic Search',
					'device'   => 'mobile',
					'userType' => 'new',
					'current'  => 210,
					'previous' => 168,
				),
				array(
					'channel'  => 'Organic Search',
					'device'   => 'desktop',
					'userType' => 'new',
					'current'  => 30,
					'previous' => 0,
				),
				array(
					'channel'  => 'Direct',
					'device'   => 'desktop',
					'userType' => 'returning',
					'current'  => 118,
					'previous' => 137,
				),
				array(
					'channel'  => 'Email',
					'device'   => 'mobile',
					'userType' => 'new',
					'current'  => 0,
					'previous' => 40,
				),
			),
			$this->get_contextual_data()['channelBreakdowns'],
			'`channelBreakdowns` should pair each channel, device and visitor type, and list 0 visits for the period a combination is missing from.'
		);
	}

	public function test_build__names_the_values_of_each_breakdown_by_what_they_are() {
		$this->report_rows = array(
			self::CHANNEL_SOURCES   => array(
				array( 'Referral', 'news.example.com', 'date_range_0', 47 ),
			),
			self::CHANNEL_PAGES     => array(
				array( 'Organic Search', '/plant-garlic/', 'date_range_0', 96 ),
			),
			self::CHANNEL_CAMPAIGNS => array(
				array( 'Email', 'spring-sale', 'date_range_0', 42 ),
			),
		);

		$contextual_data = $this->get_contextual_data();

		$this->assertSame(
			array(
				'channelBreakdowns' => array(),
				'channelSources'    => array(
					array(
						'channel'  => 'Referral',
						'source'   => 'news.example.com',
						'current'  => 47,
						'previous' => 0,
					),
				),
				'channelPages'      => array(
					array(
						'channel'  => 'Organic Search',
						'page'     => '/plant-garlic/',
						'current'  => 96,
						'previous' => 0,
					),
				),
				'channelCampaigns'  => array(
					array(
						'channel'  => 'Email',
						'campaign' => 'spring-sale',
						'current'  => 42,
						'previous' => 0,
					),
				),
			),
			$contextual_data,
			'Each breakdown should name its values `channel` and `source`, `page` or `campaign`.'
		);
	}

	public function test_build__builds_a_content_row_for_each_post_with_its_age() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			self::CONTENT => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
				array( '/mulching-in-autumn/', 'Mulching in autumn', '20260912', 'date_range_0', 40 ),
			),
		);

		$this->assertSame(
			array(
				array(
					'url'              => '/how-to-plant-garlic/',
					'title'            => 'How to plant garlic',
					'publishedDaysAgo' => 14,
					'current'          => 96,
					'previous'         => 0,
				),
				array(
					'url'              => '/mulching-in-autumn/',
					'title'            => 'Mulching in autumn',
					'publishedDaysAgo' => 3,
					'current'          => 40,
					'previous'         => 0,
				),
			),
			$this->get_contextual_data()['content'],
			'`content` should have each post with its path, its title, its days from publication to `2026-09-15`, and its visits in each period.'
		);
	}

	public function test_build__lists_a_post_once_with_the_title_of_its_first_row_in_the_selected_period() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			self::CONTENT => array(
				array( '/growing-tomatoes/', 'Growing tomatoes in pots', '20260801', 'date_range_1', 20 ),
				array( '/growing-tomatoes/', 'Growing tomatoes', '20260801', 'date_range_0', 30 ),
				array( '/growing-tomatoes/', 'Growing tomatoes in pots', '20260801', 'date_range_0', 6 ),
			),
		);

		$this->assertSame(
			array(
				array(
					'url'              => '/growing-tomatoes/',
					'title'            => 'Growing tomatoes',
					'publishedDaysAgo' => 45,
					'current'          => 36,
					'previous'         => 20,
				),
			),
			$this->get_contextual_data()['content'],
			'`content` should list the post once, with the title of its first row in the selected period, `Growing tomatoes`, and the visits of its rows in each period added together.'
		);
	}

	public function test_build__does_not_list_a_row_whose_post_date_is_not_a_date() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			// Analytics groups the less common values of a report with many values
			// into a row labeled `(other)`.
			self::CONTENT => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
				array( '(other)', '(other)', '(other)', 'date_range_0', 80 ),
			),
		);

		$this->assertSame(
			array( '/how-to-plant-garlic/' ),
			array_column( $this->get_contextual_data()['content'], 'url' ),
			"`content` should not list the `(other)` row, whose post date isn't a date."
		);
	}

	public function test_build__does_not_list_a_post_dated_on_a_day_that_does_not_exist() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			self::CONTENT => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
				array( '/spring-planting/', 'Spring planting', '20260231', 'date_range_0', 70 ),
			),
		);

		$this->assertSame(
			array( '/how-to-plant-garlic/' ),
			array_column( $this->get_contextual_data()['content'], 'url' ),
			'`content` should not list `/spring-planting/`, whose post date `20260231` is 31 February.'
		);
	}

	public function test_build__reports_a_post_dated_after_the_end_date_as_published_0_days_ago() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			self::CONTENT => array(
				array( '/harvest-notes/', 'Harvest notes', '20260916', 'date_range_0', 50 ),
			),
		);

		$this->assertSame( 0, $this->get_contextual_data()['content'][0]['publishedDaysAgo'], 'A post dated `2026-09-16` should be reported as published 0 days before `2026-09-15`.' );
	}

	public function test_build__marks_the_posts_of_the_content_report_published_in_the_selected_period() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$this->report_rows = array(
			'date'        => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			self::CONTENT => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_1', 0 ),
				array( '/', 'Home', '20260901', 'date_range_0', 900 ),
				array( '/last-spring/', 'Last spring', '20260301', 'date_range_0', 300 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					'date'  => '2026-09-01',
					'posts' => array(
						array(
							'title' => 'How to plant garlic',
							'url'   => '/how-to-plant-garlic/',
						),
					),
				),
			),
			$response['contentMarkers'],
			'`contentMarkers` should mark `/how-to-plant-garlic/` on the day it was published, and leave out the home page and the post published before the period.'
		);
	}

	public function test_build__marks_no_posts_when_the_property_has_no_post_date_dimension() {
		$this->report_rows = array(
			'date'        => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			self::CONTENT => array(
				array( '/how-to-plant-garlic/', 'How to plant garlic', '20260901', 'date_range_0', 96 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( array(), $response['contentMarkers'], '`contentMarkers` should be empty when the property has no post date dimension, since the content report does not run.' );
	}

	public function test_build__returns_the_same_response_when_every_report_returns_its_rows_in_reverse_order() {
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );
		$this->provide_key_factor_reports();
		$this->report_rows[ self::CONTENT ] = array(
			array( '/b-post/', 'B post', '20260901', 'date_range_0', 30 ),
			array( '/a-post/', 'A post', '20260901', 'date_range_0', 30 ),
		);

		$first_response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->report_rows = array_map( 'array_reverse', $this->report_rows );

		$second_response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertCount( 2, $first_response['keyFactors'], 'The response should have two key factor cards.' );
		$this->assertSame( $first_response, $second_response, 'The `build()` method should return the same response when every report returns its rows in the reverse order.' );
	}

	public function test_build__returns_no_number_with_decimals_other_than_a_bound_or_a_share_with_one_decimal() {
		$this->provide_key_factor_reports();

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$decimals = array();
		$shares   = array();
		array_walk_recursive(
			$response,
			function ( $value, $key ) use ( &$decimals, &$shares ) {
				if ( 'sharePct' === $key ) {
					$shares[] = $value;
				} elseif ( is_float( $value ) && ! in_array( $key, array( 'expectedMin', 'expectedMax' ), true ) ) {
					$decimals[] = $value;
				}
			}
		);

		$this->assertSame( array(), $decimals, 'The response should have no number with decimals other than the bounds of the expected range and the shares.' );
		$this->assertNotEmpty( $shares, 'The response should have the shares of its key factor cards.' );

		foreach ( $shares as $share ) {
			$this->assertSame( round( $share, 1 ), $share, 'A share should have at most one decimal.' );
		}

		foreach ( $response['dailyTraffic'] as $day ) {
			foreach ( array( 'expectedMin', 'expectedMax' ) as $bound ) {
				if ( null !== $day[ $bound ] ) {
					$this->assertSame( round( $day[ $bound ], 1 ), $day[ $bound ], "The `$bound` of `{$day['date']}` should have at most one decimal." );
				}
			}
		}
	}

	public function test_build__does_not_save_anything_to_the_site() {
		$this->provide_reports_for_every_dimension();

		$site_data_before = $this->get_saved_site_data();

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$site_data_after = $this->get_saved_site_data();

		$this->assertSame( $site_data_before['options'], $site_data_after['options'], 'The `build()` method should add or change no option and no transient.' );
		$this->assertSame( $site_data_before['post_meta'], $site_data_after['post_meta'], 'The `build()` method should add or change no post meta.' );
		$this->assertSame( $site_data_before['user_meta'], $site_data_after['user_meta'], 'The `build()` method should add or change no user meta.' );
	}

	public function test_build__asks_analytics_for_the_reports_again_on_every_call() {
		$this->builder->build( '2026-08-19', '2026-09-15' );
		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertCount( 2, $this->batch_requests, 'The second `build()` call should make its own batch call rather than reuse the first response.' );
	}

	public function test_build__runs_the_contextual_data_filter_with_the_rows_built_so_far_and_the_period() {
		$this->report_rows = array(
			'date'                   => array(
				array( '20260818', 388 ),
				array( '20260915', 412 ),
			),
			self::CHANNEL_BREAKDOWNS => array(
				array( 'Organic Search', 'mobile', 'new', 'date_range_0', 210 ),
				array( 'Organic Search', 'mobile', 'new', 'date_range_1', 168 ),
			),
		);

		$filter_args = array();
		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( ...$args ) use ( &$filter_args ) {
				$filter_args = $args;

				return $args[0];
			},
			10,
			2
		);

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					'channelBreakdowns' => array(
						array(
							'channel'  => 'Organic Search',
							'device'   => 'mobile',
							'userType' => 'new',
							'current'  => 210,
							'previous' => 168,
						),
					),
					'channelSources'    => array(),
					'channelPages'      => array(),
					'channelCampaigns'  => array(),
				),
				array(
					'start_date'         => '2026-08-19',
					'end_date'           => '2026-09-15',
					'compare_start_date' => '2026-07-22',
					'compare_end_date'   => '2026-08-18',
					'row_limit'          => 500,
				),
			),
			$filter_args,
			'The filter should receive the rows built from the Analytics reports, and the two periods with the row limit of `500`.'
		);
	}

	public function test_build__passes_only_the_rows_to_a_callback_that_accepts_one_argument() {
		$filter_arg_count = 0;
		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( ...$args ) use ( &$filter_arg_count ) {
				$filter_arg_count = count( $args );

				return $args[0];
			}
		);

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( 1, $filter_arg_count, 'A callback added with the default of one accepted argument should receive only the rows, as `apply_filters()` would pass them.' );
	}

	public function test_build__passes_the_validated_rows_of_a_callback_to_the_next_callback() {
		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( $contextual_data ) {
				$contextual_data['browsers']      = array(
					array(
						'label'    => 'Chrome',
						'current'  => 300,
						'previous' => 200,
					),
				);
				$contextual_data['searchQueries'] = array(
					array(
						'label'            => 'plant garlic',
						'current'          => '300',
						'previous'         => 200,
						'positionCurrent'  => '3.4',
						'positionPrevious' => 4.8,
					),
				);

				return $contextual_data;
			}
		);

		$received_data = array();
		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( $contextual_data ) use ( &$received_data ) {
				$received_data = $contextual_data;

				return $contextual_data;
			},
			20
		);

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				'channelBreakdowns' => array(),
				'channelSources'    => array(),
				'channelPages'      => array(),
				'channelCampaigns'  => array(),
				'searchQueries'     => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 200,
						'positionCurrent'  => 3.4,
						'positionPrevious' => 4.8,
					),
				),
			),
			$received_data,
			'The callback at priority 20 should receive the rows the first callback returned after they are validated: without `browsers`, and with its numeric strings stored as numbers.'
		);
	}

	public function test_build__runs_the_callbacks_in_the_order_of_their_priority_when_the_later_priority_is_added_first() {
		$received_data = array();
		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( $contextual_data ) use ( &$received_data ) {
				$received_data = $contextual_data;

				return $contextual_data;
			},
			20
		);

		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( $contextual_data ) {
				$contextual_data['searchQueries'] = array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 200,
						'positionCurrent'  => 3.4,
						'positionPrevious' => 4.8,
					),
				);

				return $contextual_data;
			},
			5
		);

		$this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertArrayHasKey( 'searchQueries', $received_data, 'The callback at priority 20 should run after the one at priority 5, and receive its `searchQueries` rows, even though it was added first.' );
	}

	public function test_build__returns_the_key_factor_cards() {
		$this->provide_key_factor_reports();
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_date' );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				array(
					'kind'                => 'CONTENT',
					'label'               => 'Plant garlic',
					'current'             => 150,
					'previous'            => 0,
					'sharePct'            => 75.0,
					'shareBasis'          => 'PARENT_CHANNEL',
					'parentChannel'       => 'Organic Search',
					'parentChannelChange' => 200,
					'attributes'          => array(),
					'url'                 => '/plant-garlic/',
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Direct',
					'current'    => 380,
					'previous'   => 300,
					'sharePct'   => 28.6,
					'shareBasis' => 'GROSS_CHANGE',
					'attributes' => array(),
				),
			),
			$response['keyFactors'],
			'The cards should be the new `/plant-garlic/` post, whose 150 visits are 75% of the rise of `Organic Search`, and `Direct`, whose one device and one visitor type have all of its visits, so neither explains its rise.'
		);
	}

	public function test_build__lists_the_landing_page_of_a_channel_card_when_the_page_is_no_post_published_in_the_period() {
		$this->provide_key_factor_reports();

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array(
				'kind'       => 'CHANNEL',
				'label'      => 'Organic Search',
				'current'    => 600,
				'previous'   => 400,
				'sharePct'   => 71.4,
				'shareBasis' => 'GROSS_CHANGE',
				'attributes' => array(
					array(
						'kind'      => 'LANDING_PAGE',
						'label'     => '/plant-garlic/',
						'current'   => 150,
						'previous'  => 50,
						'sharePct'  => 50.0,
						'oversized' => false,
					),
				),
			),
			$response['keyFactors'][0],
			'Without the post date dimension, `/plant-garlic/` is no new post, so `Organic Search` should keep its card, with the page that carried half of its rise.'
		);
	}

	public function test_build__returns_the_channels_with_the_most_visits_as_the_key_factor_cards_of_a_steady_period() {
		$this->provide_steady_reports();

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertTrue( $response['steadyTraffic'], 'A period on which no channel changed notably should be steady.' );
		$this->assertSame(
			array(
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Organic Search',
					'current'    => 302,
					'previous'   => 300,
					'sharePct'   => 43.1,
					'shareBasis' => 'VOLUME',
					'attributes' => array(),
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Direct',
					'current'    => 199,
					'previous'   => 200,
					'sharePct'   => 28.4,
					'shareBasis' => 'VOLUME',
					'attributes' => array(),
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Referral',
					'current'    => 121,
					'previous'   => 120,
					'sharePct'   => 17.3,
					'shareBasis' => 'VOLUME',
					'attributes' => array(),
				),
			),
			$response['keyFactors'],
			'The cards should be the three channels with the most visits, each with its share of the site\'s 700 visits.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should make no call for the attributes of channel cards.' );
	}

	public function test_build__returns_a_period_whose_channels_changed_notably_as_not_steady() {
		$this->provide_key_factor_reports();

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertFalse( $response['steadyTraffic'], 'A period whose channels moved against each other should not be steady.' );
	}

	public function test_build__returns_a_period_without_key_factors_as_not_steady() {
		$this->provide_steady_reports();
		$this->report_rows['date'] = $this->get_daily_report_rows( '2026-07-23', '2026-09-15', fn() => 25 );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( array(), $response['keyFactors'], 'There should be no key factor cards while the compare period has a day before the site was measured.' );
		$this->assertFalse( $response['steadyTraffic'], 'A period without key factors should not be steady.' );
	}

	public function test_build__sends_the_cards_of_a_steady_period_as_its_decomposition() {
		$this->enable_feature( 'trafficInsights' );
		$this->provide_steady_reports();

		$response      = $this->builder->build( '2026-08-19', '2026-09-15' );
		$decomposition = $response['insightRequest']['decomposition'];

		$this->assertSame( 'STEADY', $decomposition['shape'], 'The decomposition of a steady period should be `STEADY`.' );
		$this->assertSame(
			array_column( $response['keyFactors'], 'label' ),
			array_column( $decomposition['key_factors'], 'title' ),
			'The decomposition should carry the cards of the response, in their order.'
		);
		$this->assertSame(
			array_column( $response['keyFactors'], 'sharePct' ),
			array_column( $decomposition['key_factors'], 'traffic_impact_pct' ),
			'Each card of the decomposition should carry the share of the site\'s visits its card shows.'
		);
		$this->assertSame(
			array( 'VOLUME' ),
			array_values( array_unique( array_column( $decomposition['key_factors'], 'share_basis' ) ) ),
			'Each card\'s share should be of the site\'s visits.'
		);
		$this->assertSame( -2, $decomposition['residual_delta'], 'The residual should be the change of `Email`, which has no card.' );
	}

	public function test_build__names_the_sources_of_facebook_as_one_referring_site_card() {
		$this->report_rows = array(
			'date'                   => array(
				array( '20260722', 600 ),
				array( '20260819', 890 ),
			),
			self::CHANNEL_BREAKDOWNS => array(
				array( 'Organic Social', 'desktop', 'returning', 'date_range_0', 190 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_0', 700 ),
				array( 'Organic Social', 'desktop', 'returning', 'date_range_1', 100 ),
				array( 'Direct', 'desktop', 'returning', 'date_range_1', 500 ),
			),
			self::CHANNEL_SOURCES    => array(
				array( 'Organic Social', 'm.facebook.com', 'date_range_0', 60 ),
				array( 'Organic Social', 'facebook.com', 'date_range_0', 70 ),
				array( 'Organic Social', 'l.facebook.com', 'date_range_0', 50 ),
				array( 'Organic Social', 'x.com', 'date_range_0', 10 ),
				array( 'Organic Social', 'm.facebook.com', 'date_range_1', 30 ),
				array( 'Organic Social', 'facebook.com', 'date_range_1', 40 ),
				array( 'Organic Social', 'l.facebook.com', 'date_range_1', 20 ),
				array( 'Organic Social', 'x.com', 'date_range_1', 10 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( 'CHANNEL Direct', 'REFERRING_SITE Facebook' ),
			array_map( fn( $card ) => "{$card['kind']} {$card['label']}", $response['keyFactors'] ),
			'The cards should be `Direct` and the `Facebook` referring site, whose three sources carried all of the rise of `Organic Social`.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for no reports of its own for the cards.' );
	}

	public function test_build__makes_no_more_calls_for_the_key_factor_cards() {
		$this->report_rows = array(
			'date'                   => $this->get_daily_report_rows( '2026-07-22', '2026-09-15', fn() => 25 ),
			self::CHANNEL_BREAKDOWNS => array(
				array( 'Organic Search', 'desktop', 'returning', 'date_range_0', 600 ),
				array( 'Organic Search', 'desktop', 'returning', 'date_range_1', 400 ),
			),
		);

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( array( 'Organic Search' ), array_column( $response['keyFactors'], 'label' ), 'The only card should be `Organic Search`.' );
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should make no call for the rows of a card.' );
	}

	public function test_build__returns_no_key_factor_cards_while_the_compare_period_starts_before_the_first_day_with_traffic() {
		$this->provide_key_factor_reports();
		$this->report_rows['date'] = $this->get_daily_report_rows( '2026-07-23', '2026-09-15', fn() => 25 );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertFalse( $response['availability']['key_factors_available'], 'The availability should have no key factor cards while the compare period starts the day before the first day with traffic.' );
		$this->assertSame( '2026-09-16', $response['availability']['key_factors_available_from'], 'The cards should show from the period that ends on `2026-09-16`, whose compare period starts on `2026-07-23`, the first day with traffic.' );
		$this->assertSame( array(), $response['keyFactors'], 'There should be no key factor cards while the compare period has a day before the site was measured.' );
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should make no call for the attributes of cards it does not return.' );
	}

	public function test_build__returns_no_key_factor_cards_when_no_day_has_traffic() {
		$this->provide_key_factor_reports();
		unset( $this->report_rows['date'] );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( array(), $response['keyFactors'], 'There should be no key factor cards when no day of the daily series has traffic.' );
	}

	public function test_build__lists_a_search_query_a_callback_adds_on_the_card_of_organic_search() {
		$this->provide_key_factor_reports();

		add_filter( 'googlesitekit_benchmarking_contextual_data', array( $this, 'add_plant_garlic_search_rows' ) );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( 'CHANNEL Organic Search', 'CHANNEL Direct' ),
			array_map( fn( $card ) => "{$card['kind']} {$card['label']}", $response['keyFactors'] ),
			'No search query should be a card.'
		);
		$this->assertSame(
			array(
				array(
					'kind'      => 'SEARCH_KEYWORD',
					'label'     => 'plant garlic',
					'current'   => 160,
					'previous'  => 20,
					'sharePct'  => 46.7,
					'oversized' => false,
				),
				array(
					'kind'      => 'LANDING_PAGE',
					'label'     => '/plant-garlic/',
					'current'   => 150,
					'previous'  => 50,
					'sharePct'  => 50.0,
					'oversized' => false,
				),
			),
			$response['keyFactors'][0]['attributes'],
			'The `plant garlic` search query, which gained 140 of the site\'s 200 more search clicks, should be a row of `Organic Search`, before its landing page.'
		);
	}

	/**
	 * Adds the `plant garlic` search query and the site's search clicks to the
	 * contextual data, as the `googlesitekit_benchmarking_contextual_data`
	 * callback of Search Console does.
	 *
	 * @param array $contextual_data The rows, keyed by contextual data key.
	 * @return array The rows, with `searchQueries` and `searchClicks`.
	 */
	public function add_plant_garlic_search_rows( $contextual_data ) {
		$contextual_data['searchQueries'] = array(
			array(
				'label'            => 'plant garlic',
				'current'          => 160,
				'previous'         => 20,
				'positionCurrent'  => 2.1,
				'positionPrevious' => 8.4,
			),
		);
		$contextual_data['searchClicks']  = array(
			array(
				'current'  => 300,
				'previous' => 100,
			),
		);

		return $contextual_data;
	}

	/**
	 * @dataProvider data_failing_contextual_data_callbacks
	 *
	 * @param callable $failing_callback A `googlesitekit_benchmarking_contextual_data` callback that fails.
	 */
	public function test_build__keeps_the_rows_of_analytics_and_of_every_other_callback_when_a_callback_fails( $failing_callback ) {
		$this->provide_key_factor_reports();

		add_filter( 'googlesitekit_benchmarking_contextual_data', array( $this, 'add_plant_garlic_search_rows' ) );

		$expected_response = $this->builder->build( '2026-08-19', '2026-09-15' );

		// The failing callback runs first, at priority 5, so the callback above
		// still has to receive the rows built from Analytics reports.
		add_filter( 'googlesitekit_benchmarking_contextual_data', $failing_callback, 5 );

		$response = $this->builder->build( '2026-08-19', '2026-09-15' );

		$this->assertSame( 'SEARCH_KEYWORD', $expected_response['keyFactors'][0]['attributes'][0]['kind'], 'The response without the failing callback should have the search keyword row of the other callback.' );
		$this->assertSame( $expected_response, $response, 'The failing callback should leave the response the same, with the row of the other callback and every card built from Analytics reports.' );
	}

	public function data_failing_contextual_data_callbacks() {
		return array(
			'a callback that throws'           => array(
				function () {
					throw new Exception( 'The callback failed.' );
				},
			),
			'a callback that returns a string' => array(
				fn() => 'plant garlic',
			),
			'a callback that returns nothing'  => array(
				function () {},
			),
		);
	}
}
