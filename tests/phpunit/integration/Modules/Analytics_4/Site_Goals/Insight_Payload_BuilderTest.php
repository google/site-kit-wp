<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals\Insight_Payload_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals\Insight_Payload_Builder;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\Fake_Benchmarking_Reports_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Analytics_4
 */
class Insight_Payload_BuilderTest extends TestCase {

	use Fake_Benchmarking_Reports_Trait;

	/**
	 * Analytics 4 module instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Insight_Payload_Builder instance.
	 *
	 * @var Insight_Payload_Builder
	 */
	private $builder;

	/**
	 * Body of each `batchRunReports` request the fake Analytics API received.
	 *
	 * @var array
	 */
	private $batch_requests = array();

	/**
	 * Whether the fake Analytics API refuses the `batchRunReports` call.
	 *
	 * @var bool
	 */
	private $refuses_batch_call = false;

	/**
	 * Rows the fake Analytics API returns, keyed by report: `engagement`,
	 * `key_actions` or `year_ago_key_actions`.
	 *
	 * Each row lists its dimension values in the order the report asks for them,
	 * then its `dateRange`, then its metric values.
	 *
	 * @var array
	 */
	protected $report_rows = array();

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

		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );
		$this->analytics->get_settings()->merge(
			array(
				'propertyID'         => '12345',
				'detectedEvents'     => array( 'submit_lead_form', 'contact', 'purchase', 'add_to_cart' ),
				// 23:59:59.999 UTC on `2025-07-22`, the day before the year-ago previous period of the end date `2026-09-15` starts.
				'propertyCreateTime' => 1753228799999,
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$batch_request          = json_decode( (string) $request->getBody(), true );
				$this->batch_requests[] = $batch_request;

				if ( $this->refuses_batch_call ) {
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

		$this->builder = new Insight_Payload_Builder( $this->analytics );
	}

	public function test_build__asks_for_the_three_reports_in_one_batch_call_over_the_four_periods_of_the_end_date() {
		$this->provide_lead_rows();

		$this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for every report in one `batchRunReports` call.' );
		$this->assertSame(
			array(
				array( '2026-08-19 to 2026-09-15', '2026-07-22 to 2026-08-18' ),
				array( '2026-08-19 to 2026-09-15', '2026-07-22 to 2026-08-18' ),
				array( '2025-08-20 to 2025-09-16', '2025-07-23 to 2025-08-19' ),
			),
			$this->get_requested_periods(),
			'The `build()` method should ask for the engagement and the key action reports over the 28 days that end on `2026-09-15` and the 28 days before them. The year-ago report should cover both periods 364 days earlier.'
		);
		$this->assertSame(
			array( array(), array( 'eventName' ), array( 'eventName' ) ),
			$this->get_requested_dimensions(),
			'The `build()` method should ask for the sessions of the whole site, and for the key actions by event name alone on the whole widget.'
		);
	}

	public function test_build__asks_for_the_year_ago_periods_364_days_back_across_29_february() {
		$this->builder->build( 'lead', '', '2028-03-10' );

		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the reports of the end date `2028-03-10` in one `batchRunReports` call.' );
		$this->assertCount( 3, $this->batch_requests[0]['requests'], 'The `build()` method should ask for the year-ago report of the end date `2028-03-10` as the third report of the call.' );
		$this->assertSame(
			array( '2027-02-13 to 2027-03-12', '2027-01-16 to 2027-02-12' ),
			$this->get_requested_periods()[2],
			'The `build()` method should move the year-ago periods 364 days back when 29 February falls between them and the end date. Each year-ago day then keeps its weekday.'
		);
	}

	public function test_build__sums_every_lead_event_analytics_has_found_and_sends_generate_lead() {
		$this->provide_lead_rows();

		$this->assertSame(
			array(
				'event_name'               => 'generate_lead',
				'month_start_date'         => '2026-08-19',
				'current'                  => array(
					'conversions'     => 150,
					'conversion_rate' => 0.025,
					'sessions'        => 6000,
					'engagement_rate' => 0.66,
				),
				'previous'                 => array(
					'conversions'     => 100,
					'conversion_rate' => 0.02,
					'sessions'        => 5000,
					'engagement_rate' => 0.6,
				),
				'yoy_current_conversions'  => 130,
				'yoy_previous_conversions' => 125,
			),
			$this->builder->build( 'lead', '', '2026-09-15' ),
			'The `build()` method should add up `contact` and `submit_lead_form` in each period, and send them as `generate_lead` with every field in the order the service reads them. A property created at the last moment of `2025-07-22` gets both year-ago counts.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the Leads reports in one `batchRunReports` call.' );
		$this->assertSame(
			array( array(), array( 'contact', 'submit_lead_form' ), array( 'contact', 'submit_lead_form' ) ),
			$this->get_requested_event_names(),
			'The `build()` method should ask both key action reports for `contact` and `submit_lead_form`, the lead events Analytics has found, and the engagement report for no event.'
		);
	}

	public function test_build__counts_only_the_form_of_a_form_tab_and_keeps_the_sessions_of_the_whole_site() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.66', '6000' ),
				array( 'date_range_1', '0.6', '5000' ),
			),
			'key_actions' => array(
				array( 'contact', '123', 'date_range_0', '40' ),
				array( 'submit_lead_form', '123', 'date_range_0', '20' ),
				array( 'contact', '456', 'date_range_0', '90' ),
				array( 'contact', '123', 'date_range_1', '30' ),
				array( 'contact', '456', 'date_range_1', '70' ),
			),
		);

		$this->assertSame(
			array(
				'event_name'       => 'generate_lead',
				'month_start_date' => '2026-08-19',
				'current'          => array(
					'conversions'     => 60,
					'conversion_rate' => 0.01,
					'sessions'        => 6000,
					'engagement_rate' => 0.66,
				),
				'previous'         => array(
					'conversions'     => 30,
					'conversion_rate' => 0.006,
					'sessions'        => 5000,
					'engagement_rate' => 0.6,
				),
			),
			$this->builder->build( 'lead', '123', '2026-09-15' ),
			'The `build()` method should count the form `123` alone on its tab, and divide by the sessions of the whole site.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the reports of a form tab in one `batchRunReports` call.' );
		$this->assertSame(
			array(
				array(),
				array( 'eventName', 'customEvent:googlesitekit_form_id' ),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should split the key actions by form on a form tab, and ask for the sessions of the whole site.'
		);
	}

	public function test_build__counts_the_form_of_a_tab_named_0() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '1000' ),
				array( 'date_range_1', '0.5', '1000' ),
			),
			'key_actions' => array(
				array( 'contact', '0', 'date_range_0', '7' ),
				array( 'contact', '456', 'date_range_0', '90' ),
				array( 'contact', '0', 'date_range_1', '3' ),
			),
		);

		$entry = $this->builder->build( 'lead', '0', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should build an entry for the form `0`.' );
		$this->assertSame(
			array( 7, 3 ),
			array( $entry['current']['conversions'], $entry['previous']['conversions'] ),
			'The `build()` method should read the tab `0` as the form `0`, never as the whole widget.'
		);
	}

	public function test_build__counts_only_the_provider_of_a_provider_tab() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '2000' ),
				array( 'date_range_1', '0.4', '1000' ),
			),
			'key_actions' => array(
				array( 'purchase', 'woocommerce', 'date_range_0', '12' ),
				array( 'purchase', 'easy-digital-downloads', 'date_range_0', '5' ),
				array( 'purchase', 'woocommerce', 'date_range_1', '8' ),
			),
		);

		$entry = $this->builder->build( 'ecommerce', 'woocommerce', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should build an entry for the `woocommerce` provider tab.' );
		$this->assertSame(
			array( 12, 8 ),
			array( $entry['current']['conversions'], $entry['previous']['conversions'] ),
			'The `build()` method should count the `woocommerce` provider alone on its tab.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the reports of a provider tab in one `batchRunReports` call.' );
		$this->assertSame(
			array(
				array(),
				array( 'eventName', 'customEvent:googlesitekit_event_provider' ),
			),
			$this->get_requested_dimensions(),
			'The `build()` method should split the key actions by event provider on a provider tab, and ask for the sessions of the whole site.'
		);
	}

	public function test_build__sends_purchase_when_analytics_has_found_it() {
		$this->provide_store_rows();

		$entry = $this->builder->build( 'ecommerce', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should build an Online store entry when Analytics has found `purchase`.' );
		$this->assertSame(
			'purchase',
			$entry['event_name'],
			'The `build()` method should send `purchase` as the event name when Analytics has found `purchase` on the site.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the Online store reports in one `batchRunReports` call.' );
		$this->assertSame(
			array( array(), array( 'purchase' ), array( 'purchase' ) ),
			$this->get_requested_event_names(),
			'The `build()` method should ask both key action reports for `purchase` alone when Analytics has found it.'
		);
	}

	public function test_build__sends_add_to_cart_when_analytics_has_found_no_purchase() {
		$this->analytics->get_settings()->merge( array( 'detectedEvents' => array( 'add_to_cart', 'contact' ) ) );
		$this->provide_store_rows();

		$entry = $this->builder->build( 'ecommerce', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should build an Online store entry when Analytics has found no `purchase`.' );
		$this->assertSame(
			'add_to_cart',
			$entry['event_name'],
			'The `build()` method should send `add_to_cart` as the event name when Analytics has found no `purchase` on the site.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the Online store reports in one `batchRunReports` call when Analytics has found no `purchase`.' );
		$this->assertSame(
			array( array(), array( 'add_to_cart' ), array( 'add_to_cart' ) ),
			$this->get_requested_event_names(),
			'The `build()` method should ask both key action reports for `add_to_cart` alone when Analytics has found no `purchase`.'
		);
	}

	public function test_build__rounds_the_rates_to_4_decimals_and_casts_the_counts_to_integers() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.666666', '3000' ),
				array( 'date_range_1', '0.123456', '7' ),
			),
			'key_actions' => array(
				array( 'contact', 'date_range_0', '1000' ),
				array( 'contact', 'date_range_1', '2' ),
			),
		);

		$entry = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should build an entry for the 1000 and 2 key actions of the two periods.' );
		$this->assertSame(
			array(
				'conversions'     => 1000,
				'conversion_rate' => 0.3333,
				'sessions'        => 3000,
				'engagement_rate' => 0.6667,
			),
			$entry['current'],
			'The `build()` method should send 1000 of 3000 sessions as the rate `0.3333`, and the engagement rate `0.666666` as `0.6667`, with integer counts.'
		);
		$this->assertSame(
			array(
				'conversions'     => 2,
				'conversion_rate' => 0.2857,
				'sessions'        => 7,
				'engagement_rate' => 0.1235,
			),
			$entry['previous'],
			'The `build()` method should send 2 of 7 sessions as the rate `0.2857`, and the engagement rate `0.123456` as `0.1235`, with integer counts.'
		);
	}

	public function test_build__sends_a_conversion_rate_of_0_when_a_period_has_no_sessions() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '1000' ),
			),
			'key_actions' => array(
				array( 'contact', 'date_range_0', '10' ),
				array( 'contact', 'date_range_1', '4' ),
			),
		);

		$entry = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should build an entry when Analytics returned no sessions for the previous period.' );
		$this->assertSame(
			array(
				'conversions'     => 4,
				'conversion_rate' => 0.0,
				'sessions'        => 0,
				'engagement_rate' => 0.0,
			),
			$entry['previous'],
			'The `build()` method should send a conversion rate and an engagement rate of `0.0` for a period Analytics returned no sessions for.'
		);
	}

	public function test_build__leaves_out_the_year_ago_counts_and_request_when_the_property_was_created_on_the_first_year_ago_day() {
		// 00:00 UTC on `2025-07-23`, the first day of the year-ago previous period of the end date `2026-09-15`.
		$this->analytics->get_settings()->merge( array( 'propertyCreateTime' => 1753228800000 ) );
		$this->provide_lead_rows();

		$entry = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should still build an entry for a property created on `2025-07-23`.' );
		$this->assertSame(
			array( 'event_name', 'month_start_date', 'current', 'previous' ),
			array_keys( $entry ),
			'The `build()` method should leave out both year-ago counts when the property was created at 00:00 UTC on `2025-07-23`.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the reports of a property created on `2025-07-23` in one `batchRunReports` call.' );
		$this->assertCount( 2, $this->batch_requests[0]['requests'], 'The `build()` method should not ask for the year-ago report when it leaves out the year-ago counts.' );
	}

	public function test_build__leaves_out_the_year_ago_counts_when_the_property_create_time_is_not_synchronized() {
		$this->analytics->get_settings()->merge( array( 'propertyCreateTime' => 0 ) );
		$this->provide_lead_rows();

		$entry = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should still build an entry while `propertyCreateTime` is `0`.' );
		$this->assertSame(
			array( 'event_name', 'month_start_date', 'current', 'previous' ),
			array_keys( $entry ),
			'The `build()` method should leave out both year-ago counts while `propertyCreateTime` is `0`, before Site Kit synchronizes it.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the reports in one `batchRunReports` call while `propertyCreateTime` is `0`.' );
		$this->assertCount( 2, $this->batch_requests[0]['requests'], 'The `build()` method should not ask for the year-ago report while `propertyCreateTime` is `0`.' );
	}

	public function test_build__leaves_out_the_year_ago_counts_and_request_on_a_form_tab() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '1000' ),
				array( 'date_range_1', '0.5', '1000' ),
			),
			'key_actions' => array(
				array( 'contact', '123', 'date_range_0', '5' ),
				array( 'contact', '123', 'date_range_1', '3' ),
			),
		);

		$entry = $this->builder->build( 'lead', '123', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should build an entry for the form `123`.' );
		$this->assertSame(
			array( 'event_name', 'month_start_date', 'current', 'previous' ),
			array_keys( $entry ),
			'The `build()` method should leave out both year-ago counts on a form tab, even for a property created before the year-ago periods.'
		);
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask for the reports of a form tab in one `batchRunReports` call.' );
		$this->assertCount( 2, $this->batch_requests[0]['requests'], 'The `build()` method should not ask for the year-ago report on a form tab.' );
	}

	public function test_build__returns_null_when_neither_period_has_a_conversion() {
		$this->report_rows = array(
			'engagement' => array(
				array( 'date_range_0', '0.5', '1000' ),
				array( 'date_range_1', '0.5', '1000' ),
			),
		);

		$this->assertNull( $this->builder->build( 'lead', '', '2026-09-15' ), 'The `build()` method should return `null` when Analytics counts no key action in either period.' );
		$this->assertCount( 1, $this->batch_requests, 'The `build()` method should ask Analytics once before it finds that neither period has a key action.' );
	}

	public function test_build__builds_the_entry_when_only_the_current_period_has_a_conversion() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '1000' ),
				array( 'date_range_1', '0.5', '1000' ),
			),
			'key_actions' => array(
				array( 'contact', 'date_range_0', '5' ),
			),
		);

		$entry = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should return the entry as an array when only the current period has key actions.' );
		$this->assertSame(
			array( 5, 0 ),
			array( $entry['current']['conversions'], $entry['previous']['conversions'] ),
			'The `build()` method should build the entry when the current period has 5 key actions and the previous period has none.'
		);
	}

	public function test_build__builds_the_entry_when_only_the_previous_period_has_a_conversion() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '1000' ),
				array( 'date_range_1', '0.5', '1000' ),
			),
			'key_actions' => array(
				array( 'contact', 'date_range_1', '5' ),
			),
		);

		$entry = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertIsArray( $entry, 'The `build()` method should return the entry as an array when only the previous period has key actions.' );
		$this->assertSame(
			array( 0, 5 ),
			array( $entry['current']['conversions'], $entry['previous']['conversions'] ),
			'The `build()` method should build the entry when the current period has no key action and the previous period has 5.'
		);
	}

	public function test_build__returns_null_without_a_request_when_analytics_has_found_no_event_of_the_goal_type() {
		$this->analytics->get_settings()->merge( array( 'detectedEvents' => array( 'purchase', 'add_to_cart' ) ) );

		$this->assertNull( $this->builder->build( 'lead', '', '2026-09-15' ), 'The `build()` method should return `null` for `lead` when Analytics has found store events alone.' );
		$this->assertCount( 0, $this->batch_requests, 'The `build()` method should ask Analytics for no report when Analytics has found no event of the goal type.' );
	}

	public function test_build__gives_the_same_json_for_the_same_data_in_another_row_order() {
		$this->provide_lead_rows();
		$first_entry = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertIsArray( $first_entry, 'The `build()` method should build an entry from the lead rows.' );

		$this->report_rows = array_map( 'array_reverse', $this->report_rows );
		$second_entry      = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertSame(
			wp_json_encode( $first_entry ),
			wp_json_encode( $second_entry ),
			'The `build()` method should give the same JSON when Analytics returns the same rows in another order.'
		);
	}

	public function test_build__returns_the_error_of_a_failed_batch_call() {
		$this->refuses_batch_call = true;

		$response = $this->builder->build( 'lead', '', '2026-09-15' );

		$this->assertWPError( $response, 'The `build()` method should return an error when the batch call fails.' );
		$this->assertSame( 403, $response->get_error_code(), 'The error should have the `403` code the Analytics 4 module returned for the failed batch call.' );
		$this->assertSame( 'User does not have sufficient permissions for this property.', $response->get_error_message(), 'The error should have the message Analytics returned.' );
	}

	/**
	 * Makes the fake Analytics API return the rows of a site whose lead events are
	 * `contact` and `submit_lead_form`.
	 *
	 * @since 1.192.0
	 */
	private function provide_lead_rows() {
		$this->report_rows = array(
			'engagement'           => array(
				array( 'date_range_0', '0.66', '6000' ),
				array( 'date_range_1', '0.6', '5000' ),
			),
			'key_actions'          => array(
				array( 'contact', 'date_range_0', '90' ),
				array( 'submit_lead_form', 'date_range_0', '60' ),
				array( 'contact', 'date_range_1', '70' ),
				array( 'submit_lead_form', 'date_range_1', '30' ),
			),
			'year_ago_key_actions' => array(
				array( 'contact', 'date_range_0', '80' ),
				array( 'submit_lead_form', 'date_range_0', '50' ),
				array( 'contact', 'date_range_1', '75' ),
				array( 'submit_lead_form', 'date_range_1', '50' ),
			),
		);
	}

	/**
	 * Makes the fake Analytics API return the rows of a store whose key action is `purchase`.
	 *
	 * @since 1.192.0
	 */
	private function provide_store_rows() {
		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '2000' ),
				array( 'date_range_1', '0.4', '1000' ),
			),
			'key_actions' => array(
				array( 'purchase', 'date_range_0', '20' ),
				array( 'purchase', 'date_range_1', '15' ),
			),
		);
	}

	/**
	 * Builds the report the fake Analytics API returns for one report request,
	 * from the rows in `$report_rows` for that report.
	 *
	 * PHP runs this method in place of the trait's `build_report()`, which answers `totalUsers` alone.
	 *
	 * @since 1.192.0
	 *
	 * @param array $report_request The report request, as the batch call sent it.
	 * @return array The report, in the shape Analytics returns it.
	 */
	private function build_report( array $report_request ) {
		$metric_names    = array_column( $report_request['metrics'], 'name' );
		$dimension_names = array_column( $report_request['dimensions'] ?? array(), 'name' );

		// Analytics adds a `dateRange` dimension to a report with two periods.
		$dimension_names[] = 'dateRange';

		$report = array(
			'dimensionHeaders' => array_map(
				fn( $dimension_name ) => array( 'name' => $dimension_name ),
				$dimension_names
			),
			'metricHeaders'    => array_map(
				fn( $metric_name ) => array( 'name' => $metric_name ),
				$metric_names
			),
		);

		$rows = array_map(
			fn( $row ) => array(
				'dimensionValues' => array_map(
					fn( $dimension_value ) => array( 'value' => $dimension_value ),
					array_slice( $row, 0, count( $dimension_names ) )
				),
				'metricValues'    => array_map(
					fn( $metric_value ) => array( 'value' => $metric_value ),
					array_slice( $row, count( $dimension_names ) )
				),
			),
			$this->report_rows[ $this->get_report_key( $report_request ) ] ?? array()
		);

		// Analytics leaves the `rows` key out of a report with no rows.
		if ( ! empty( $rows ) ) {
			$report['rows'] = $rows;
		}

		return $report;
	}

	/**
	 * Gets the key of `$report_rows` that a report request asks for.
	 *
	 * @since 1.192.0
	 *
	 * @param array $report_request The report request, as the batch call sent it.
	 * @return string `engagement`, `key_actions` or `year_ago_key_actions`.
	 */
	private function get_report_key( array $report_request ) {
		if ( 'engagementRate' === $report_request['metrics'][0]['name'] ) {
			return 'engagement';
		}

		return '2026-08-19' === $report_request['dateRanges'][0]['startDate'] ? 'key_actions' : 'year_ago_key_actions';
	}

	/**
	 * Gets the periods of each report of the batch call, in the order the call asks for them.
	 *
	 * @since 1.192.0
	 *
	 * @return array List of reports, each a list of periods as `<startDate> to <endDate>`.
	 */
	private function get_requested_periods() {
		return array_map(
			fn( $report_request ) => array_map(
				fn( $date_range ) => "{$date_range['startDate']} to {$date_range['endDate']}",
				$report_request['dateRanges']
			),
			$this->batch_requests[0]['requests']
		);
	}

	/**
	 * Gets the dimensions of each report of the batch call, in the order the call asks for them.
	 *
	 * @since 1.192.0
	 *
	 * @return array List of reports, each a list of dimension names.
	 */
	private function get_requested_dimensions() {
		return array_map(
			fn( $report_request ) => array_column( $report_request['dimensions'] ?? array(), 'name' ),
			$this->batch_requests[0]['requests']
		);
	}

	/**
	 * Gets the event names each report of the batch call filters by, in the order the call asks for them.
	 *
	 * @since 1.192.0
	 *
	 * @return array List of reports, each a list of the event names its `eventName` filter selects.
	 *               A report with no such filter gets an empty list.
	 */
	private function get_requested_event_names() {
		return array_map(
			function ( $report_request ) {
				foreach ( $report_request['dimensionFilter']['andGroup']['expressions'] ?? array() as $expression ) {
					if ( 'eventName' === ( $expression['filter']['fieldName'] ?? null ) ) {
						return $expression['filter']['inListFilter']['values'] ?? array( $expression['filter']['stringFilter']['value'] );
					}
				}

				return array();
			},
			$this->batch_requests[0]['requests']
		);
	}
}
