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
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\REST_Modules_Controller;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Wire_Format;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Benchmarking_DataTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;

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

	public function set_up() {
		parent::set_up();

		$this->admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin_id );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $this->context );
		$user_options  = new User_Options( $this->context, $this->admin_id );

		$this->fake_proxy_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$authentication = new Authentication( $this->context, $this->options, $user_options );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-token' ) );

		$this->analytics = new Analytics_4( $this->context, $this->options, $user_options, $authentication );
		$this->modules   = new Modules( $this->context, $this->options, $user_options, $authentication );

		// The module's own scope reaches the client through a filter its
		// `register()` adds, which this test does not call.
		$authentication->get_oauth_client()->set_granted_scopes(
			array_merge(
				$authentication->get_oauth_client()->get_required_scopes(),
				$this->analytics->get_scopes()
			)
		);

		// Answer from the module instance the test holds, so a test can reach
		// the datapoint the controller uses.
		$this->force_set_property( $this->modules, 'modules', array( Analytics_4::MODULE_SLUG => $this->analytics ) );
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( Analytics_4::MODULE_SLUG ) );

		$this->register_permissions_for_user( $this->admin_id );

		remove_all_filters( 'googlesitekit_rest_routes' );
		( new REST_Modules_Controller( $this->modules ) )->register();
		$this->register_rest_routes();
	}

	/**
	 * Registers the capability map for a user.
	 *
	 * The instance the plugin registered at bootstrap stays bound to the user
	 * it was built for, so a test that switches users needs its own.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id The user the capabilities are resolved for.
	 */
	private function register_permissions_for_user( $user_id ) {
		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'user_has_cap' );

		$user_options = new User_Options( $this->context, $user_id );

		// Authentication reads the token of the user it was built for, so a
		// reader checked against the administrator's would look authenticated.
		( new Permissions(
			$this->context,
			new Authentication( $this->context, $this->options, $user_options ),
			$this->modules,
			$user_options,
			new Dismissed_Items( $user_options )
		) )->register();
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Builds a response builder that records every call and answers with the
	 * given value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $result Optional. Value `build()` answers with. Default an empty response.
	 * @return Response_Builder The recording builder, whose `calls` property holds each `[ $start_date, $end_date ]` pair.
	 */
	private function create_recording_builder( $result = null ) {
		return new class( $this->analytics, $this->context, $result ) extends Response_Builder {

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

			public function __construct( Analytics_4 $analytics_4, Context $context, $result ) {
				parent::__construct( $analytics_4, $context );
				$this->result = $result;
			}

			public function build( $start_date, $end_date ) {
				$this->calls[] = array( $start_date, $end_date );

				if ( null === $this->result ) {
					return parent::build( $start_date, $end_date );
				}

				return $this->result;
			}
		};
	}

	/**
	 * Enables the feature flag and puts a recording builder behind the
	 * datapoint.
	 *
	 * @since n.e.x.t
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
	 * Requests the datapoint.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params Optional. Query parameters. Default the two valid dates.
	 * @return \WP_REST_Response The response.
	 */
	private function request( array $params = null ) {
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
				'visitors'       => array(
					'current'  => 1200,
					'previous' => 1000,
				),
				'dailyTraffic'   => array(
					array(
						'date'     => '2026-08-19',
						'visitors' => 40,
					),
					array(
						'date'     => '2026-08-20',
						'visitors' => 55,
					),
				),
				'dimensions'     => array( 'CHANNELS' ),
				'contextualData' => array(
					'channels' => array(
						array(
							'label'    => 'Organic Search',
							'current'  => 700,
							'previous' => 600,
						),
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
		$this->assertSame( array( 40, 55 ), $data[ Wire_Format::MEMBER_DAILY_VISITORS ], 'The response should carry the daily visitor counts.' );
		$this->assertSame( array( 1200, 1000 ), $data[ Wire_Format::MEMBER_VISITOR_TOTALS ], 'The response should carry the two visitor totals.' );
		$this->assertSame( array( Wire_Format::DIMENSION_INDEXES['CHANNELS'] ), $data[ Wire_Format::MEMBER_DIMENSION_ORDER ], 'The response should carry the dimension order.' );
		$this->assertContains( 'Organic Search', $data[ Wire_Format::MEMBER_STRINGS ], 'The response should carry the row values in its string table.' );
	}

	public function test_rest_endpoint__is_not_registered_without_the_feature_flag() {
		// A datapoint the module never defines is a datapoint no report can run
		// behind, which is what the refusal below stands for.
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

	public function test_rest_endpoint__reaches_a_view_only_reader() {
		$builder = $this->enable_datapoint();

		// The module has to be connected and shared before a reader without an
		// account of their own can read from it.
		$this->analytics->get_settings()->merge(
			array(
				'accountID'       => '12345',
				'propertyID'      => '67890',
				'webDataStreamID' => '13579',
				'measurementID'   => 'G-ABCDEF1234',
				'ownerID'         => $this->admin_id,
			)
		);
		( new Module_Sharing_Settings( $this->options ) )->set(
			array( Analytics_4::MODULE_SLUG => array( 'sharedRoles' => array( 'editor' ) ) )
		);

		$reader_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		( new Dismissed_Items( new User_Options( $this->context, $reader_id ) ) )->add( 'shared_dashboard_splash', 0 );

		wp_set_current_user( $reader_id );
		$this->register_permissions_for_user( $reader_id );

		$this->assertTrue( current_user_can( Permissions::VIEW_DASHBOARD ), 'The reader should be able to view the dashboard.' );
		$this->assertFalse( current_user_can( Permissions::MANAGE_OPTIONS ), 'The reader should not be able to manage options.' );

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'A view-only reader should reach the datapoint.' );
		$this->assertCount( 1, $builder->calls, 'The view-only request should reach the builder.' );
	}

	public function test_rest_endpoint__refuses_an_administrator_who_is_not_authenticated() {
		$builder = $this->enable_datapoint();

		// The route's own default for a read datapoint lets any user through
		// who can run setup, whether or not they have connected an account.
		// The datapoint declares a check that asks about the dashboard instead,
		// and this administrator is the user the two answer differently for.
		$other_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $other_admin );
		$this->register_permissions_for_user( $other_admin );

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
		$this->register_permissions_for_user( $subscriber_id );

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
		global $wpdb;

		$builder = $this->enable_datapoint();

		// A transient is an `options` row on a site with no persistent object
		// cache, so the options snapshot covers those too.
		$options_before   = $wpdb->get_results( "SELECT option_name, option_value FROM $wpdb->options ORDER BY option_name", ARRAY_A );
		$post_meta_before = $wpdb->get_results( "SELECT post_id, meta_key, meta_value FROM $wpdb->postmeta ORDER BY meta_id", ARRAY_A );
		$user_meta_before = $wpdb->get_results( "SELECT user_id, meta_key, meta_value FROM $wpdb->usermeta ORDER BY umeta_id", ARRAY_A );

		$first  = $this->request();
		$second = $this->request();

		$this->assertSame( 200, $first->get_status(), 'The first request should answer 200.' );
		$this->assertSame( 200, $second->get_status(), 'The second request should answer 200.' );
		$this->assertCount( 2, $builder->calls, 'Each request should assemble its own response rather than reading a stored one.' );

		wp_cache_flush();

		$this->assertSame(
			$options_before,
			$wpdb->get_results( "SELECT option_name, option_value FROM $wpdb->options ORDER BY option_name", ARRAY_A ),
			'No option or transient should be added or changed by the requests.'
		);
		$this->assertSame(
			$post_meta_before,
			$wpdb->get_results( "SELECT post_id, meta_key, meta_value FROM $wpdb->postmeta ORDER BY meta_id", ARRAY_A ),
			'No post meta should be added or changed by the requests.'
		);
		$this->assertSame(
			$user_meta_before,
			$wpdb->get_results( "SELECT user_id, meta_key, meta_value FROM $wpdb->usermeta ORDER BY umeta_id", ARRAY_A ),
			'No user meta should be added or changed by the requests.'
		);
	}
}
