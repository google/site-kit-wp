<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Benchmarking_DataTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Wire_Format;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Tests\Authenticated_Search_Console_Trait;
use Google\Site_Kit\Tests\Dashboard_Sharing_Trait;
use Google\Site_Kit\Tests\Fake_Benchmarking_Reports_Trait;
use Google\Site_Kit\Tests\Saved_Site_Data_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use WP_Error;
use WP_REST_Request;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Benchmarking_DataTest extends TestCase {

	use Authenticated_Search_Console_Trait;
	use Dashboard_Sharing_Trait;
	use Fake_Benchmarking_Reports_Trait;
	use Saved_Site_Data_Trait;

	const START_DATE = '2026-08-19';
	const END_DATE   = '2026-09-15';

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Analytics 4 module instance the controller answers from.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Modules instance.
	 *
	 * @var Modules
	 */
	private $modules;

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * The `contextualData` keys the builder had rows for, after the Search
	 * Console module added its search query rows.
	 *
	 * @var array
	 */
	private $contextual_data_keys = array();

	public function set_up() {
		parent::set_up();

		$this->admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin_id );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $this->context );
		$user_options  = new User_Options( $this->context, $this->admin_id );

		$this->authenticate_user( $this->admin_id, array( Analytics_4::READONLY_SCOPE ) );

		$authentication  = new Authentication( $this->context, $this->options, $user_options );
		$this->analytics = new Analytics_4( $this->context, $this->options, $user_options, $authentication );
		$this->modules   = new Modules( $this->context, $this->options, $user_options, $authentication );

		// Answer from the module instance the test holds, so a test can reach
		// the datapoint the controller uses.
		$this->force_set_property( $this->modules, 'modules', array( Analytics_4::MODULE_SLUG => $this->analytics ) );
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( Analytics_4::MODULE_SLUG ) );

		$this->register_permissions_for_user( $this->admin_id, $this->modules );
		$this->register_modules_rest_routes( $this->modules );
	}

	public function tear_down() {
		parent::tear_down();
		// Leave no server behind for the next test class.
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Builds a response builder that records every call and answers with the
	 * given value.
	 *
	 * @since 1.190.0
	 *
	 * @param mixed $result Optional. Value `build()` answers with. Default an empty response.
	 * @return Response_Builder The recording builder, whose `calls` property holds each `[ $start_date, $end_date ]` pair.
	 */
	private function create_recording_builder( $result = null ) {
		return new class( $this->context, $this->analytics, $result ) extends Response_Builder {

			/**
			 * Each `[ $start_date, $end_date ]` pair `build()` was called with.
			 *
			 * @var array
			 */
			public $calls = array();

			/**
			 * Value `build()` answers with.
			 *
			 * @var mixed
			 */
			private $result;

			public function __construct( Context $context, Analytics_4 $analytics_4, $result ) {
				parent::__construct( $analytics_4, new Custom_Dimensions_Data_Available( new Transients( $context ) ) );
				$this->result = $result;
			}

			public function build( $start_date, $end_date ) {
				$this->calls[] = array( $start_date, $end_date );

				if ( null === $this->result ) {
					return array(
						'visits'       => array(),
						'dailyTraffic' => array(),
						'keyFactors'   => array(),
					);
				}

				return $this->result;
			}
		};
	}

	/**
	 * Enables the feature flag and puts a recording builder behind the
	 * datapoint.
	 *
	 * @since 1.190.0
	 *
	 * @param mixed $result Optional. Value the builder answers with. Default an empty response.
	 * @return Response_Builder The recording builder.
	 */
	private function enable_datapoint( $result = null ) {
		$this->enable_feature( 'typicalTraffic' );

		$builder   = $this->create_recording_builder( $result );
		$datapoint = $this->analytics->get_datapoint_definition( 'GET:benchmarking-data' );

		$this->force_set_property( $datapoint, 'response_builder', $builder );

		return $builder;
	}

	/**
	 * Enables `typicalTraffic`, connects Analytics and Search Console under the
	 * administrator's account, gives every report a row, and shares the given
	 * modules with the Editor role.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $shared_module_slugs The modules shared with the Editor role, such as `array( Analytics_4::MODULE_SLUG )`.
	 */
	private function set_up_shared_dashboard( array $shared_module_slugs ) {
		$this->enable_feature( 'typicalTraffic' );

		// `set_up()` grants the administrator the Analytics scope only.
		$this->authenticate_user( $this->admin_id, array( Analytics_4::READONLY_SCOPE, 'https://www.googleapis.com/auth/webmasters' ) );

		$this->analytics->get_settings()->merge(
			array(
				'accountID'       => '12345',
				'propertyID'      => '67890',
				'webDataStreamID' => '13579',
				'measurementID'   => 'G-ABCDEF1234',
				'ownerID'         => $this->admin_id,
			)
		);
		$this->options->set(
			Search_Console_Settings::OPTION,
			array(
				'propertyID' => 'https://example.com/',
				'ownerID'    => $this->admin_id,
			)
		);
		$this->share_modules_with_editors( $shared_module_slugs );

		// The site doubles, from 200 visitors in the compare period to 400 in
		// the selected one, while each row grows from 200 to 240. That change is
		// big enough to count and far from the site's, so no row is left out.
		$this->report_rows = array(
			'date'                          => array(
				array( '20260801', 200 ),
				array( '20260901', 400 ),
			),
			'sessionDefaultChannelGrouping' => array(
				array( 'Organic Search', 'date_range_0', 240 ),
				array( 'Organic Search', 'date_range_1', 200 ),
			),
			'deviceCategory'                => array(
				array( 'mobile', 'date_range_0', 240 ),
				array( 'mobile', 'date_range_1', 200 ),
			),
			'newVsReturning'                => array(
				array( 'new', 'date_range_0', 240 ),
				array( 'new', 'date_range_1', 200 ),
			),
			'sessionSource'                 => array(
				array( 'a.example.com', 'date_range_0', 240 ),
				array( 'a.example.com', 'date_range_1', 200 ),
			),
		);
	}

	/**
	 * Makes the given user the current one, and builds the Analytics and Search
	 * Console modules the datapoint reads, for that user. Their Google requests
	 * go to fake APIs, which refuse a request without a token.
	 *
	 * A module reads the token of the user it was built for, so the
	 * administrator and the reader each need modules built for them.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id The user the modules are built for.
	 */
	private function switch_to_user( $user_id ) {
		wp_set_current_user( $user_id );

		$user_options   = new User_Options( $this->context, $user_id );
		$authentication = new Authentication( $this->context, $this->options, $user_options );
		$analytics      = new Analytics_4( $this->context, $this->options, $user_options, $authentication );
		$search_console = new Search_Console( $this->context, $this->options, $user_options, $authentication );

		// A module sends a request with the current user's token, or with its
		// owner's token when the current user reads a shared module. Both
		// modules send the current user's requests through the same client, so
		// faking the Analytics module's client covers Search Console too.
		$this->fake_google_api(
			array(
				$analytics->get_client(),
				$analytics->get_owner_oauth_client()->get_client(),
				$search_console->get_owner_oauth_client()->get_client(),
			),
			function ( Request $request ) {
				if ( 'analyticsdata.googleapis.com' === $request->getUri()->getHost() ) {
					return $this->create_analytics_batch_response( json_decode( (string) $request->getBody(), true ) );
				}

				return $this->create_plant_garlic_batch_response( $request );
			}
		);

		$this->force_set_property(
			$this->modules,
			'modules',
			array(
				Analytics_4::MODULE_SLUG    => $analytics,
				Search_Console::MODULE_SLUG => $search_console,
			)
		);

		// Only the Search Console module built for this user should add the
		// search query rows.
		remove_all_filters( 'googlesitekit_benchmarking_contextual_data' );
		$search_console->register();

		$this->register_permissions_for_user( $user_id, $this->modules );
	}

	/**
	 * Records the `contextualData` keys the builder has rows for, after the
	 * Search Console module adds its search query rows.
	 *
	 * The encoded response doesn't carry these rows, so the test reads them
	 * here, before they are ranked.
	 *
	 * @since n.e.x.t
	 */
	private function record_contextual_data_keys() {
		add_filter(
			'googlesitekit_benchmarking_contextual_data',
			function ( $contextual_data ) {
				$this->contextual_data_keys = array_keys( $contextual_data );

				return $contextual_data;
			},
			20
		);
	}

	/**
	 * Requests the datapoint.
	 *
	 * @since 1.190.0
	 *
	 * @param array $params Optional. Query parameters. Default the two valid dates.
	 * @return \WP_REST_Response The response.
	 */
	private function request( ?array $params = null ) {
		if ( null === $params ) {
			$params = array(
				'startDate' => self::START_DATE,
				'endDate'   => self::END_DATE,
			);
		}

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/analytics-4/data/benchmarking-data' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	public function test_rest_endpoint__answers_with_the_encoded_response() {
		$builder = $this->enable_datapoint(
			array(
				'visits'       => array(
					'current'  => 1200,
					'previous' => 1000,
				),
				'dailyTraffic' => array(
					array(
						'date'   => '2026-08-19',
						'visits' => 40,
					),
					array(
						'date'   => '2026-08-20',
						'visits' => 55,
					),
				),
				'keyFactors'   => array(
					array(
						'kind'       => 'CHANNEL',
						'label'      => 'Organic Search',
						'current'    => 700,
						'previous'   => 600,
						'sharePct'   => 58.3,
						'attributes' => array(),
					),
				),
			)
		);

		$response = $this->request();
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'A request with two valid dates should answer 200.' );
		$this->assertSame(
			array( array( self::START_DATE, self::END_DATE ) ),
			$builder->calls,
			'The builder should be called once, with the two dates from the request.'
		);

		// The response travels in the wire format rather than as named fields.
		$this->assertSame( Wire_Format::FORMAT_VERSION, $data[ Wire_Format::MEMBER_VERSION ], 'The response should carry the wire format version.' );
		$this->assertSame( '2026-08-19', $data[ Wire_Format::MEMBER_FIRST_DATE ], 'The response should carry the first daily traffic date.' );
		$this->assertSame( array( 40, 55 ), $data[ Wire_Format::MEMBER_DAILY_VISITS ], 'The response should carry the daily visit counts.' );
		$this->assertSame( array( 1200, 1000 ), $data[ Wire_Format::MEMBER_VISIT_TOTALS ], 'The response should carry the two visit totals.' );
		$this->assertSame( array( 'Organic Search' ), $data[ Wire_Format::MEMBER_STRINGS ], 'The response should carry the card label in its string table.' );
		$this->assertSame( array( array( 0, 0, 700, 600, 58.3 ) ), $data[ Wire_Format::MEMBER_KEY_FACTORS ], 'The response should carry the `CHANNEL` card as a list of its kind, label, counts and share.' );
		$this->assertSame( array( array() ), $data[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ], 'The response should carry one empty list of attributes for the card.' );
	}

	public function test_rest_endpoint__is_not_registered_without_the_feature_flag() {
		// The module never defines the datapoint, so no report can run.
		$this->assertNotContains( 'benchmarking-data', $this->analytics->get_datapoints(), 'The datapoint should not be defined with the feature flag off.' );

		$response = $this->request();

		$this->assertSame( 400, $response->get_status(), 'A request should answer 400 with the feature flag off.' );
		$this->assertSame( 'invalid_datapoint', $response->get_data()['code'], 'The error code should name the unknown datapoint.' );
	}

	/**
	 * @dataProvider data_unusable_parameters
	 *
	 * @param array  $params        Query parameters the request is made with.
	 * @param string $expected_code Error code the response should carry.
	 */
	public function test_rest_endpoint__refuses_unusable_dates( $params, $expected_code ) {
		$builder = $this->enable_datapoint();

		$response = $this->request( $params );

		$this->assertSame( 400, $response->get_status(), 'A request with an unusable date should answer 400.' );
		$this->assertSame( $expected_code, $response->get_data()['code'], 'The response should name why the date was refused.' );
		$this->assertSame( array(), $builder->calls, 'No report should run for a request with an unusable date.' );
	}

	public function data_unusable_parameters() {
		$missing = 'missing_required_param';
		$invalid = 'invalid_param';

		return array(
			'no startDate'          => array( array( 'endDate' => self::END_DATE ), $missing ),
			'no endDate'            => array( array( 'startDate' => self::START_DATE ), $missing ),
			'empty startDate'       => array(
				array(
					'startDate' => '',
					'endDate'   => self::END_DATE,
				),
				$missing,
			),
			'empty endDate'         => array(
				array(
					'startDate' => self::START_DATE,
					'endDate'   => '',
				),
				$missing,
			),
			'unpadded month'        => array(
				array(
					'startDate' => '2026-8-19',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'day first'             => array(
				array(
					'startDate' => '19-08-2026',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'timestamp'             => array(
				array(
					'startDate' => '2026-08-19T00:00:00Z',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'relative date'         => array(
				array(
					'startDate' => 'yesterday',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'trailing newline'      => array(
				array(
					'startDate' => "2026-08-19\n",
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'trailing CRLF'         => array(
				array(
					'startDate' => self::START_DATE,
					'endDate'   => "2026-09-15\r\n",
				),
				$invalid,
			),
			'zero date'             => array(
				array(
					'startDate' => '0000-00-00',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'month 13 and day 45'   => array(
				array(
					'startDate' => '2026-13-45',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'day that never was'    => array(
				array(
					'startDate' => '2026-02-30',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'unusable endDate'      => array(
				array(
					'startDate' => self::START_DATE,
					'endDate'   => '2026-09-31',
				),
				$invalid,
			),
			'startDate after end'   => array(
				array(
					'startDate' => self::END_DATE,
					'endDate'   => self::START_DATE,
				),
				$invalid,
			),
			'startDate a day after' => array(
				array(
					'startDate' => '2026-09-16',
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
			'array startDate'       => array(
				array(
					'startDate' => array( self::START_DATE ),
					'endDate'   => self::END_DATE,
				),
				$invalid,
			),
		);
	}

	public function test_rest_endpoint__names_the_two_ways_a_date_is_refused() {
		$this->enable_datapoint();

		$misformatted = $this->request(
			array(
				'startDate' => '19-08-2026',
				'endDate'   => self::END_DATE,
			)
		);
		$out_of_order = $this->request(
			array(
				'startDate' => self::END_DATE,
				'endDate'   => self::START_DATE,
			)
		);

		$this->assertStringContainsString( 'YYYY-MM-DD', $misformatted->get_data()['message'], 'A misformatted date should say what shape was expected.' );
		$this->assertStringContainsString( 'startDate', $misformatted->get_data()['message'], 'A misformatted date should name the parameter.' );
		$this->assertStringContainsString( 'later than', $out_of_order->get_data()['message'], 'Two dates in the wrong order should say so rather than name one parameter as invalid.' );
		$this->assertNotSame(
			$misformatted->get_data()['message'],
			$out_of_order->get_data()['message'],
			'The two refusals should read differently.'
		);
	}

	public function test_rest_endpoint__accepts_a_single_day() {
		$builder = $this->enable_datapoint();

		$response = $this->request(
			array(
				'startDate' => self::START_DATE,
				'endDate'   => self::START_DATE,
			)
		);

		$this->assertSame( 200, $response->get_status(), 'A request whose two dates are the same day should answer 200.' );
		$this->assertSame( array( array( self::START_DATE, self::START_DATE ) ), $builder->calls, 'The builder should be called with the single day.' );
	}

	public function test_rest_endpoint__accepts_a_period_of_197_days() {
		$builder = $this->enable_datapoint();

		$response = $this->request(
			array(
				'startDate' => '2026-03-03',
				'endDate'   => '2026-09-15',
			)
		);

		$this->assertSame( 200, $response->get_status(), 'A request for the 197 days from `2026-03-03` to `2026-09-15` should answer 200.' );
		$this->assertSame( array( array( '2026-03-03', '2026-09-15' ) ), $builder->calls, 'The `build()` method should be called with `2026-03-03` and `2026-09-15`, the first and the last day of the 197 days.' );
	}

	public function test_rest_endpoint__refuses_a_period_of_198_days() {
		$builder = $this->enable_datapoint();

		$response = $this->request(
			array(
				'startDate' => '2026-03-02',
				'endDate'   => '2026-09-15',
			)
		);

		$this->assertSame( 400, $response->get_status(), 'A request for the 198 days from `2026-03-02` to `2026-09-15` should answer 400.' );
		$this->assertSame( 'invalid_param', $response->get_data()['code'], 'The error code should be `invalid_param` for a period of 198 days.' );
		$this->assertStringContainsString( '197 days', $response->get_data()['message'], 'The error message should name the longest period the datapoint accepts, 197 days.' );
		$this->assertSame( array(), $builder->calls, 'No report should run for a period of 198 days.' );
	}

	public function test_rest_endpoint__answers_the_same_for_any_other_parameter() {
		$builder = $this->enable_datapoint();

		$without = $this->request();
		$with    = $this->request(
			array(
				'startDate' => self::START_DATE,
				'endDate'   => self::END_DATE,
				'url'       => home_url( '/some-post/' ),
			)
		);

		$this->assertSame( 200, $with->get_status(), 'A request carrying another parameter should answer 200.' );
		$this->assertEquals( $without->get_data(), $with->get_data(), 'Two requests with the same dates should answer the same response.' );
		$this->assertSame(
			array(
				array( self::START_DATE, self::END_DATE ),
				array( self::START_DATE, self::END_DATE ),
			),
			$builder->calls,
			'Both requests should reach the builder with the same two dates.'
		);
	}

	public function test_rest_endpoint__reaches_a_user_who_can_view_the_dashboard() {
		$builder = $this->enable_datapoint();

		$this->assertTrue( current_user_can( Permissions::VIEW_DASHBOARD ), 'The administrator should be able to view the dashboard.' );

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'A user who can view the dashboard should reach the datapoint.' );
		$this->assertCount( 1, $builder->calls, 'The request should reach the builder.' );
	}

	public function test_rest_endpoint__answers_a_view_only_reader_with_the_response_the_owner_gets() {
		$this->set_up_shared_dashboard( array( Analytics_4::MODULE_SLUG, Search_Console::MODULE_SLUG ) );

		$this->switch_to_user( $this->admin_id );
		$owner_response = $this->request();

		$reader_id = $this->create_view_only_reader();
		$this->switch_to_user( $reader_id );

		$this->assertFalse( ( new Authentication( $this->context, $this->options, new User_Options( $this->context, $reader_id ) ) )->is_authenticated(), 'The reader should not have connected a Google account of their own.' );

		$this->record_contextual_data_keys();
		$reader_response = $this->request();

		$this->assertSame( 200, $reader_response->get_status(), 'A view-only reader should get the benchmarking data.' );
		$this->assertSame( array( 'Bearer valid-token', 'Bearer valid-token' ), $this->google_api_authorizations['analyticsdata.googleapis.com'], 'The reports of the owner and of the reader should both run under the token of the administrator who owns Analytics.' );
		$this->assertEquals( $owner_response->get_data(), $reader_response->get_data(), 'The reader should get the response the owner gets.' );
		$this->assertSame( array( 'channels', 'devices', 'visitorMix', 'referrers', 'searchQueries' ), $this->contextual_data_keys, 'The builder should have the channels, devices, visitor mix, referrers, and search queries for the reader.' );
		$this->assertSame( array(), $reader_response->get_data()[ Wire_Format::MEMBER_KEY_FACTORS ], 'The response should carry no key factor cards, since the builder returns no cards.' );
		$this->assertSame( array(), $reader_response->get_data()[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ], 'The response should carry no key factor attributes, since the builder returns no cards.' );
	}

	public function test_rest_endpoint__builds_every_dimension_except_the_search_queries_for_a_view_only_reader_without_search_console_shared() {
		$this->set_up_shared_dashboard( array( Analytics_4::MODULE_SLUG ) );
		$this->switch_to_user( $this->create_view_only_reader() );
		$this->record_contextual_data_keys();

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'A reader without Search Console shared should get the benchmarking data.' );
		$this->assertSame( array( 'channels', 'devices', 'visitorMix', 'referrers' ), $this->contextual_data_keys, 'The builder should have the channels, devices, visitor mix, and referrers for the reader, without the search queries.' );
	}

	public function test_rest_endpoint__refuses_an_administrator_who_is_not_authenticated() {
		$builder = $this->enable_datapoint();

		// The route default accepts anyone who can run setup; the datapoint asks
		// about the dashboard instead. This administrator is where they disagree.
		$other_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $other_admin );
		$this->register_permissions_for_user( $other_admin, $this->modules );

		$this->assertTrue( current_user_can( Permissions::SETUP ), 'The administrator should be able to run setup, which is what the route default accepts.' );
		$this->assertFalse( current_user_can( Permissions::VIEW_DASHBOARD ), 'The administrator should not be able to view the dashboard without an account of their own.' );

		$response = $this->request();

		$this->assertSame( 403, $response->get_status(), 'The declared permission check should refuse a user the route default would have let through.' );
		$this->assertSame( array(), $builder->calls, 'No report should run for a user the datapoint refuses.' );
	}

	public function test_rest_endpoint__refuses_a_user_who_cannot_view_the_dashboard() {
		$builder = $this->enable_datapoint();

		$subscriber_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );
		$this->register_permissions_for_user( $subscriber_id, $this->modules );

		$this->assertFalse( current_user_can( Permissions::VIEW_DASHBOARD ), 'The subscriber should not be able to view the dashboard.' );

		$response = $this->request();

		$this->assertSame( 403, $response->get_status(), 'A user who cannot view the dashboard should be refused.' );
		$this->assertSame( array(), $builder->calls, 'No report should run for a user who cannot view the dashboard.' );
	}

	public function test_rest_endpoint__answers_with_the_builders_own_error() {
		$this->enable_datapoint(
			new WP_Error(
				'analytics_report_failed',
				'Request had invalid authentication credentials.',
				array( 'status' => 401 )
			)
		);

		$response = $this->request();
		$data     = $response->get_data();

		$this->assertSame( 401, $response->get_status(), 'The failed report status should reach the browser.' );
		$this->assertSame( 'analytics_report_failed', $data['code'], 'The failed report code should reach the browser.' );
		$this->assertSame( 'Request had invalid authentication credentials.', $data['message'], 'The failed report message should reach the browser.' );
		$this->assertSame( array( 'code', 'message', 'data' ), array_keys( $data ), 'The error should travel on its own, with no part of a response beside it.' );
	}

	public function test_rest_endpoint__writes_nothing_to_the_site() {
		$builder = $this->enable_datapoint();

		$site_data_before = $this->get_saved_site_data();

		$first  = $this->request();
		$second = $this->request();

		$this->assertSame( 200, $first->get_status(), 'The first request should answer 200.' );
		$this->assertSame( 200, $second->get_status(), 'The second request should answer 200.' );
		$this->assertCount( 2, $builder->calls, 'Each request should assemble its own response rather than reading a stored one.' );

		wp_cache_flush();

		$site_data_after = $this->get_saved_site_data();

		$this->assertSame( $site_data_before['options'], $site_data_after['options'], 'No option or transient should be added or changed by the requests.' );
		$this->assertSame( $site_data_before['post_meta'], $site_data_after['post_meta'], 'No post meta should be added or changed by the requests.' );
		$this->assertSame( $site_data_before['user_meta'], $site_data_after['user_meta'], 'No user meta should be added or changed by the requests.' );
	}
}
