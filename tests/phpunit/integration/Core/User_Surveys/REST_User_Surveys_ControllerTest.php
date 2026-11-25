<?php
/**
 * Class Google\Site_Kit\Tests\Core\User_Surveys\REST_User_Surveys_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Surveys
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\User_Surveys;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Surveys\REST_User_Surveys_Controller;
use Google\Site_Kit\Core\User_Surveys\Survey_Timeouts;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_User_Surveys_ControllerTest extends TestCase {

	use RestTestTrait;
	use Fake_Site_Connection_Trait;

	/**
	 * REST_User_Surveys_Controller object.
	 *
	 * @var REST_User_Surveys_Controller
	 */
	private $controller;

	/**
	 * Survey_Timeouts instance.
	 *
	 * @var Survey_Timeouts
	 */
	private $timeouts;

	/**
	 * Survey_Queue instance.
	 *
	 * @var Survey_Queue
	 */
	private $queue;

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Bodies of the requests the test sent to the Site Kit service, decoded.
	 *
	 * @var array
	 */
	private $service_requests = array();

	public function set_up() {
		parent::set_up();

		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new Authentication( $context );
		$authentication
			->get_oauth_client()
			->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->user_options = new User_Options( $context, $user->ID );
		$this->timeouts     = new Survey_Timeouts( $this->user_options );
		$this->queue        = new Survey_Queue( $this->user_options );
		$this->controller   = new REST_User_Surveys_Controller( $authentication, $this->timeouts, $this->queue );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$this->controller->register();
		$this->assertTrue(
			has_filter( 'googlesitekit_rest_routes' ),
			'User survey REST routes should be registered.'
		);
	}

	public function test_register_routes() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$this->controller->register();

		$routes = apply_filters( 'googlesitekit_rest_routes', array() );
		$this->assertEqualSets(
			array(
				'survey-event',
				'survey-trigger',
				'survey-timeouts',
				'survey',
			),
			array_keys( $routes ),
			'User survey controller should register all survey REST routes.'
		);

		$args = $routes['survey-event']->get_args();
		$this->assertEquals( 'core/user/data/survey-event', $routes['survey-event']->get_uri(), 'Survey event route should use the expected URI.' );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $args[0]['methods'], 'Survey event route should accept write requests.' );
		$this->assertTrue(
			is_callable( $args[0]['callback'] ),
			'Survey event route should have a callable request handler.'
		);
		$this->assertTrue(
			is_callable( $args[0]['permission_callback'] ),
			'Survey event route should have a callable permission check.'
		);
		$this->assertTrue( is_array( $args[0]['args'] ) && ! empty( $args[0]['args'] ), 'Survey event route should define request arguments.' );

		$args = $routes['survey-trigger']->get_args();
		$this->assertEquals( 'core/user/data/survey-trigger', $routes['survey-trigger']->get_uri(), 'Survey trigger route should use the expected URI.' );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $args[0]['methods'], 'Survey trigger route should accept write requests.' );
		$this->assertTrue(
			is_callable( $args[0]['callback'] ),
			'Survey trigger route should have a callable request handler.'
		);
		$this->assertTrue(
			is_callable( $args[0]['permission_callback'] ),
			'Survey trigger route should have a callable permission check.'
		);
		$this->assertTrue( is_array( $args[0]['args'] ) && ! empty( $args[0]['args'] ), 'Survey trigger route should define request arguments.' );

		$args = $routes['survey-timeouts']->get_args();
		$this->assertEquals( 'core/user/data/survey-timeouts', $routes['survey-timeouts']->get_uri(), 'Survey timeouts route should use the expected URI.' );
		$this->assertEquals( \WP_REST_Server::READABLE, $args[0]['methods'], 'Survey timeouts route should accept read requests.' );
		$this->assertTrue(
			is_callable( $args[0]['callback'] ),
			'Survey timeouts route should have a callable request handler.'
		);
		$this->assertTrue(
			is_callable( $args[0]['permission_callback'] ),
			'Survey timeouts route should have a callable permission check.'
		);

		$args = $routes['survey']->get_args();
		$this->assertEquals( 'core/user/data/survey', $routes['survey']->get_uri(), 'Current survey route should use the expected URI.' );
		$this->assertEquals( \WP_REST_Server::READABLE, $args[0]['methods'], 'Current survey route should accept read requests.' );
		$this->assertTrue(
			is_callable( $args[0]['callback'] ),
			'Current survey route should have a callable request handler.'
		);
		$this->assertTrue(
			is_callable( $args[0]['permission_callback'] ),
			'Current survey route should have a callable permission check.'
		);
	}

	protected function send_request( $endpoint, $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/' . $endpoint );
		$request->set_body_params(
			array(
				'data' => $data,
			)
		);

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Answers each request to the Site Kit service with the given reply, and adds the request's decoded body to `$service_requests`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $reply JSON body of the reply, an empty object by default.
	 */
	private function answer_service_requests( $reply = '{}' ) {
		$this->subscribe_to_wp_http_requests(
			function ( $url, $args ) {
				$this->service_requests[] = json_decode( $args['body'], true );
			},
			array(
				'response' => array( 'code' => 200 ),
				'headers'  => array(),
				'body'     => $reply,
			)
		);
	}

	/**
	 * Gets a survey in the shape the Site Kit service sends it.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Survey.
	 */
	private function get_service_survey() {
		return array(
			'session'                    => array(
				'session_id'    => 'test_session_id',
				'session_token' => 'test_session_token',
			),
			'survey_payload'             => array(
				'language'   => 'en_US',
				'question'   => array(
					array(
						'question_ordinal'  => 1,
						'question_text'     => 'What is the main goal of your site?',
						'question_type'     => 'open_text',
						'trigger_condition' => array(),
						'question'          => array(
							'subtitle'    => '',
							'placeholder' => '',
						),
					),
				),
				'completion' => array(
					array(
						'completion_ordinal' => 1,
						'completion_title'   => 'Thanks for sharing your thoughts!',
						'completion_text'    => 'Tell us more on our support forum.',
						'follow_up_text'     => 'Go to the forum',
						'follow_up_url'      => 'https://wordpress.org/support/plugin/google-site-kit/',
						'trigger_condition'  => null,
					),
				),
			),
			'no_available_survey_reason' => '',
			'survey_id'                  => 'test_survey',
		);
	}

	public function test_survey_trigger() {
		$survey = array(
			'survey_id' => 'test_survey',
			'session'   => array(
				'session_id'    => 'test_session_id',
				'session_token' => 'test_session_token',
			),
			'payload'   => array(
				'questions' => array(),
			),
		);

		$this->answer_service_requests( wp_json_encode( $survey ) );

		$this->fake_proxy_site_connection();
		$response = $this->send_request( 'survey-trigger', array( 'triggerID' => 'test_trigger' ) );

		$this->assertEqualSets( array( 'success' => true ), $response->get_data(), 'Successful survey trigger request should return a success response.' );
		$this->assertEqualSets( $survey, $this->queue->front(), 'Triggered survey should be added to the front of the survey queue.' );
		$this->assertCount( 1, $this->service_requests, 'Survey trigger should send the trigger to the service once.' );
		$this->assertEquals( 'test_trigger', $this->service_requests[0]['trigger_context']['trigger_id'], 'Survey trigger should send the trigger ID to the service.' );
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/survey-trigger', 'Survey trigger response should match its resource schema.' );
	}

	/**
	 * @dataProvider provider_survey_trigger__ttl
	 *
	 * @param int|string $ttl Seconds before the trigger can show a survey again.
	 */
	public function test_survey_trigger__adds_timeout_when_ttl_provided( $ttl ) {
		$this->assertEmpty(
			$this->timeouts->get_survey_timeouts(),
			'Survey trigger should not have a timeout before it is requested.'
		);

		$this->answer_service_requests();

		$this->fake_proxy_site_connection();
		$data     = array(
			'triggerID' => 'view_dashboard',
			'ttl'       => $ttl,
		);
		$response = $this->send_request( 'survey-trigger', $data );

		$this->assertEqualSets( array( 'success' => true ), $response->get_data(), 'Survey trigger with a lifetime should return a success response.' );
		$this->assertContains( 'view_dashboard', $this->timeouts->get_survey_timeouts(), 'Survey trigger should be timed out when the request includes a lifetime.' );
	}

	public function provider_survey_trigger__ttl() {
		return array(
			'the integer the dashboard sends' => array( DAY_IN_SECONDS ),
			'a numeric string'                => array( '1337' ),
		);
	}

	public function test_survey_trigger__no_timeout_when_no_ttl_provided() {
		$this->assertEmpty(
			$this->timeouts->get_survey_timeouts(),
			'Survey trigger should not have a timeout before it is requested.'
		);

		$this->answer_service_requests();

		$this->fake_proxy_site_connection();
		$response = $this->send_request( 'survey-trigger', array( 'triggerID' => 'test_trigger' ) );

		$this->assertEqualSets( array( 'success' => true ), $response->get_data(), 'Survey trigger without a lifetime should return a success response.' );
		$this->assertEmpty(
			$this->timeouts->get_survey_timeouts(),
			'Survey trigger should remain available when the request omits a lifetime.'
		);
	}

	/**
	 * @dataProvider provider_survey_trigger__invalid_data
	 *
	 * @param array  $body          Request body.
	 * @param string $expected_code Expected error code.
	 */
	public function test_survey_trigger__rejects_invalid_data( $body, $expected_code ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// The service answers with a survey, so a request that got through would queue it.
		$this->answer_service_requests( wp_json_encode( $this->get_service_survey() ) );
		$this->fake_proxy_site_connection();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey-trigger' );
		$request->set_body_params( $body );

		$this->assertRESTRequestRejected( $request, $expected_code );
		$this->assertSame( array(), $this->service_requests, 'Survey trigger endpoint should send nothing to the service for invalid data.' );
		$this->assertSame( array(), $this->timeouts->get_survey_timeouts(), 'Survey trigger endpoint should set no timeout for invalid data.' );
		$this->assertNull( $this->queue->front(), 'Survey trigger endpoint should queue no survey for invalid data.' );
	}

	public function provider_survey_trigger__invalid_data() {
		return array(
			'no data'                    => array(
				array(),
				'rest_missing_callback_param',
			),
			'data is not an object'      => array(
				array( 'data' => 'abc' ),
				'rest_invalid_param',
			),
			'data has no trigger ID'     => array(
				array( 'data' => array( 'ttl' => DAY_IN_SECONDS ) ),
				'rest_invalid_param',
			),
			'trigger ID is empty'        => array(
				array(
					'data' => array(
						'triggerID' => '',
						'ttl'       => DAY_IN_SECONDS,
					),
				),
				'rest_invalid_param',
			),
			'trigger ID is not a string' => array(
				array(
					'data' => array(
						'triggerID' => array( 'view_dashboard' ),
						'ttl'       => DAY_IN_SECONDS,
					),
				),
				'rest_invalid_param',
			),
			'ttl is below zero'          => array(
				array(
					'data' => array(
						'triggerID' => 'view_dashboard',
						'ttl'       => -1,
					),
				),
				'rest_invalid_param',
			),
			'ttl is not a number'        => array(
				array(
					'data' => array(
						'triggerID' => 'view_dashboard',
						'ttl'       => 'soon',
					),
				),
				'rest_invalid_param',
			),
			'ttl is not a whole number'  => array(
				array(
					'data' => array(
						'triggerID' => 'view_dashboard',
						'ttl'       => 1.5,
					),
				),
				'rest_invalid_param',
			),
		);
	}

	public function data_survey_event_response_codes() {
		return array(
			'successful' => array( 200 ),
			'timeout'    => array( 502 ),
		);
	}

	/**
	 * @dataProvider data_survey_event_response_codes
	 */
	public function test_survey_event_survey_shown( $code ) {
		$this->subscribe_to_wp_http_requests(
			function () {},
			array(
				'response' => array( 'code' => $code ),
				'headers'  => array(),
				'body'     => '{}',
			)
		);

		$this->fake_proxy_site_connection();
		$this->send_request(
			'survey-event',
			array(
				'session' => array(
					'session_id'    => 'test_session_id',
					'session_token' => 'test_session_token',
				),
				'event'   => array(
					'survey_shown' => array(),
				),
			)
		);

		$this->assertEquals(
			array( Survey_Timeouts::GLOBAL_KEY ),
			$this->timeouts->get_survey_timeouts(),
			'Showing a survey should establish the global survey timeout.'
		);
	}

	public function data_event_completion_types() {
		return array(
			'survey closed'    => array( 'survey_closed' ),
			'completion shown' => array( 'completion_shown' ),
		);
	}

	/**
	 * @dataProvider data_event_completion_types
	 */
	public function test_survey_event_completion( $event ) {
		$survey1 = array(
			'survey_id' => 'test_survey_1',
			'payload'   => array(),
			'session'   => array(
				'session_id'    => 'test_session_id_1',
				'session_token' => 'test_session_token_1',
			),
		);
		$survey2 = array(
			'survey_id' => 'test_survey_2',
			'payload'   => array(),
			'session'   => array(
				'session_id'    => 'test_session_id_2',
				'session_token' => 'test_session_token_2',
			),
		);
		$survey3 = array(
			'survey_id' => 'test_survey_3',
			'payload'   => array(),
			'session'   => array(
				'session_id'    => 'test_session_id_3',
				'session_token' => 'test_session_token_3',
			),
		);

		$this->user_options->set(
			Survey_Queue::OPTION,
			array(
				$survey1,
				$survey2,
				$survey3,
			)
		);

		$this->answer_service_requests();

		$this->fake_proxy_site_connection();
		$resp = $this->send_request(
			'survey-event',
			array(
				'session' => array(
					'session_id'    => 'test_session_id_2',
					'session_token' => 'test_session_token_2',
				),
				'event'   => array(
					$event => array(),
				),
			)
		);

		$this->assertEquals(
			array( $survey1, $survey3 ),
			$this->user_options->get( Survey_Queue::OPTION ),
			'Completing a survey should remove only its matching session from the queue.'
		);
		$this->assertEquals( array(), $resp->get_data(), 'Survey event endpoint should return the empty reply of the service.' );
		$this->assertMatchesRouteResourceSchema( $resp->get_data(), 'core/user/data/survey-event', 'Survey event response should match its resource schema.' );
	}

	/**
	 * @dataProvider provider_survey_event__dashboard_events
	 *
	 * @param array $event Event as the dashboard sends it, keyed by its type.
	 */
	public function test_survey_event__sends_dashboard_events( $event ) {
		$this->answer_service_requests( '{"error":"survey not found"}' );
		$this->fake_proxy_site_connection();

		$session  = array(
			'session_id'    => 'test_session_id',
			'session_token' => 'test_session_token',
		);
		$response = $this->send_request(
			'survey-event',
			array(
				'session' => $session,
				'event'   => $event,
			)
		);

		$this->assertEquals( 200, $response->get_status(), 'Survey event endpoint should accept each event the dashboard sends.' );
		$this->assertEquals( array( 'error' => 'survey not found' ), $response->get_data(), 'Survey event endpoint should return the reply of the service.' );
		$this->assertCount( 1, $this->service_requests, 'Survey event endpoint should send the event to the service once.' );
		$this->assertEquals( $session, $this->service_requests[0]['session'], 'Survey event endpoint should send the session as the dashboard sent it.' );
		$this->assertEquals( $event, $this->service_requests[0]['event'], 'Survey event endpoint should send the event as the dashboard sent it.' );
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/survey-event', 'Survey event response should match its resource schema.' );
	}

	public function provider_survey_event__dashboard_events() {
		return array(
			'survey shown'                => array( array( 'survey_shown' => array() ) ),
			'survey closed'               => array( array( 'survey_closed' => array() ) ),
			'open text question answered' => array(
				array(
					'question_answered' => array(
						'question_ordinal' => 1,
						'answer'           => array( 'answer' => 'More visitors' ),
					),
				),
			),
			'select question answered'    => array(
				array(
					'question_answered' => array(
						'question_ordinal' => 2,
						'answer'           => array(
							'answer' => array(
								'answer_ordinal' => 3,
								'answer_text'    => 'A newsletter',
							),
						),
					),
				),
			),
			'completion shown'            => array( array( 'completion_shown' => array( 'completion_ordinal' => 1 ) ) ),
			'follow-up link clicked'      => array( array( 'follow_up_link_clicked' => array( 'completion_ordinal' => 1 ) ) ),
		);
	}

	/**
	 * @dataProvider provider_survey_event__invalid_data
	 *
	 * @param array  $body          Request body.
	 * @param string $expected_code Expected error code.
	 */
	public function test_survey_event__rejects_invalid_data( $body, $expected_code ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$survey = $this->get_service_survey();
		$this->queue->enqueue( $survey );
		$this->answer_service_requests();
		$this->fake_proxy_site_connection();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey-event' );
		$request->set_body_params( $body );

		$this->assertRESTRequestRejected( $request, $expected_code );
		$this->assertSame( array(), $this->service_requests, 'Survey event endpoint should send nothing to the service for invalid data.' );
		$this->assertSame( array(), $this->timeouts->get_survey_timeouts(), 'Survey event endpoint should set no timeout for invalid data.' );
		$this->assertEquals( array( $survey ), $this->user_options->get( Survey_Queue::OPTION ), 'Survey event endpoint should leave the survey queue unchanged for invalid data.' );
	}

	public function provider_survey_event__invalid_data() {
		$session = array(
			'session_id'    => 'test_session_id',
			'session_token' => 'test_session_token',
		);
		// If the route accepted the request, `survey_shown` would set the global timeout. Where the session ID
		// matches, `survey_closed` would take the survey off the queue.
		$event = array(
			'survey_shown'  => array(),
			'survey_closed' => array(),
		);

		return array(
			'no data'                           => array(
				array(),
				'rest_missing_callback_param',
			),
			'data is not an object'             => array(
				array( 'data' => 'abc' ),
				'rest_invalid_param',
			),
			'data has no session'               => array(
				array( 'data' => array( 'event' => $event ) ),
				'rest_invalid_param',
			),
			'session is not an object'          => array(
				array(
					'data' => array(
						'session' => 'abc',
						'event'   => $event,
					),
				),
				'rest_invalid_param',
			),
			'session has no session ID'         => array(
				array(
					'data' => array(
						'session' => array( 'session_token' => 'test_session_token' ),
						'event'   => $event,
					),
				),
				'rest_invalid_param',
			),
			'session ID is empty'               => array(
				array(
					'data' => array(
						'session' => array_merge( $session, array( 'session_id' => '' ) ),
						'event'   => $event,
					),
				),
				'rest_invalid_param',
			),
			'session has no session token'      => array(
				array(
					'data' => array(
						'session' => array( 'session_id' => 'test_session_id' ),
						'event'   => $event,
					),
				),
				'rest_invalid_param',
			),
			'session token is empty'            => array(
				array(
					'data' => array(
						'session' => array_merge( $session, array( 'session_token' => '' ) ),
						'event'   => $event,
					),
				),
				'rest_invalid_param',
			),
			'session token is not a string'     => array(
				array(
					'data' => array(
						'session' => array_merge( $session, array( 'session_token' => array( 'test_session_token' ) ) ),
						'event'   => $event,
					),
				),
				'rest_invalid_param',
			),
			'data has no event'                 => array(
				array( 'data' => array( 'session' => $session ) ),
				'rest_invalid_param',
			),
			'event is not an object'            => array(
				array(
					'data' => array(
						'session' => $session,
						'event'   => 'abc',
					),
				),
				'rest_invalid_param',
			),
			'event is empty'                    => array(
				array(
					'data' => array(
						'session' => $session,
						'event'   => array(),
					),
				),
				'rest_invalid_param',
			),
			'an event type is not an object'    => array(
				array(
					'data' => array(
						'session' => $session,
						'event'   => array( 'survey_closed' => 'abc' ),
					),
				),
				'rest_invalid_param',
			),
			'event has a type outside the five' => array(
				array(
					'data' => array(
						'session' => $session,
						'event'   => array( 'survey_dismissed' => array() ),
					),
				),
				'rest_invalid_param',
			),
		);
	}

	public function test_survey_timeouts_route() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->timeouts->add( 'foo', 0 );
		$this->timeouts->add( 'bar', 100 );
		$this->timeouts->add( 'baz', -10 );
		$this->timeouts->add( '123', 100 );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey-timeouts' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSets(
			array( 'bar', '123' ),
			$response->get_data(),
			'Survey timeouts response should contain only unexpired triggers.'
		);
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/survey-timeouts', 'Survey timeouts response should match its resource schema.' );
	}

	public function test_survey() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$survey         = $this->get_service_survey();
		$another_survey = array_merge(
			$this->get_service_survey(),
			array(
				'survey_id' => 'another_test_survey',
				'session'   => array(
					'session_id'    => 'another_test_session_id',
					'session_token' => 'another_test_session_token',
				),
			)
		);

		$this->queue->enqueue( $survey );
		$this->queue->enqueue( $another_survey );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey' );
		$response = rest_get_server()->dispatch( $request )->get_data();

		$this->assertEqualSets( array( 'survey' => $survey ), $response, 'Current survey response should contain the first queued survey.' );
		$this->assertMatchesRouteResourceSchema( $response, 'core/user/data/survey', 'Current survey response should match its resource schema.' );
	}

	public function test_survey__empty_queue() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey' );
		$response = rest_get_server()->dispatch( $request )->get_data();

		$this->assertSame( array( 'survey' => null ), $response, 'Current survey response should have a null survey when the queue is empty.' );
		$this->assertMatchesRouteResourceSchema( $response, 'core/user/data/survey', 'Current survey response with an empty queue should match its resource schema.' );
	}

	public function data_survey_requests() {
		return array(
			'survey-trigger'  => array(
				'POST',
				'survey-trigger',
				array(
					'data' => array(
						'triggerID' => 'test_trigger',
						'ttl'       => 3600,
					),
				),
			),
			// Both events, so a request the route lets through sets the global timeout and takes the queued survey off.
			'survey-event'    => array(
				'POST',
				'survey-event',
				array(
					'data' => array(
						'session' => array(
							'session_id'    => 'test_session_id',
							'session_token' => 'test_session_token',
						),
						'event'   => array(
							'survey_shown'  => array(),
							'survey_closed' => array(),
						),
					),
				),
			),
			'survey-timeouts' => array( 'GET', 'survey-timeouts', array() ),
			'survey'          => array( 'GET', 'survey', array() ),
		);
	}

	/**
	 * @dataProvider data_survey_requests
	 */
	public function test_survey_routes__reject_a_cookie_request_without_a_nonce( $method, $route, $body_params ) {
		$this->fake_proxy_site_connection();
		// WordPress runs a cookie request with no REST nonce as user 0.
		// The controller still reads the token of the administrator that set_up() signed in.
		wp_set_current_user( 0 );

		$this->assert_survey_request_rejected( $method, $route, $body_params, 401 );
	}

	/**
	 * @dataProvider data_survey_requests
	 */
	public function test_survey_routes__reject_an_editor_who_kept_a_token( $method, $route, $body_params ) {
		$this->fake_proxy_site_connection();
		wp_get_current_user()->set_role( 'editor' );

		$this->assert_survey_request_rejected( $method, $route, $body_params, 403 );
	}

	/**
	 * @dataProvider data_survey_requests
	 */
	public function test_survey_routes__reject_an_administrator_without_a_token( $method, $route, $body_params ) {
		$this->fake_proxy_site_connection();
		$this->user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN );

		$this->assert_survey_request_rejected( $method, $route, $body_params, 403 );
	}

	/**
	 * @dataProvider data_survey_requests
	 */
	public function test_survey_routes__reject_an_administrator_on_a_site_without_the_proxy( $method, $route, $body_params ) {
		$this->fake_site_connection();

		$this->assert_survey_request_rejected( $method, $route, $body_params, 403 );
	}

	/**
	 * Sends a survey request, and asserts that its route rejects it and leaves the survey timeouts and queue as they were.
	 *
	 * It also asserts that the request sends nothing to the Site Kit service.
	 * The queued survey has the session that `data_survey_requests()` sends, so the queue assertion fails if the route lets a `survey_closed` event through.
	 *
	 * @param string $method      HTTP method of the request.
	 * @param string $route       Route under `core/user/data/`.
	 * @param array  $body_params Body params of the request.
	 * @param int    $status      Expected status code.
	 */
	private function assert_survey_request_rejected( $method, $route, $body_params, $status ) {
		$this->queue->enqueue(
			array(
				'survey_id' => 'queued_survey',
				'payload'   => array(),
				'session'   => array(
					'session_id'    => 'test_session_id',
					'session_token' => 'test_session_token',
				),
			)
		);
		$this->timeouts->add( 'existing_trigger', 3600 );

		$timeouts = $this->user_options->get( Survey_Timeouts::OPTION );
		$queue    = $this->user_options->get( Survey_Queue::OPTION );

		$this->answer_service_requests( wp_json_encode( $this->get_service_survey() ) );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( $method, '/' . REST_Routes::REST_ROOT . '/core/user/data/' . $route );
		$request->set_body_params( $body_params );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( $status, $response->get_status(), "The survey route should reject the request with a {$status} status." );
		$this->assertEquals( 'rest_forbidden', $data['code'], 'The survey route should reject the request with the rest_forbidden code.' );
		$this->assertEqualSets( array( 'code', 'message', 'data' ), array_keys( $data ), 'The rejected request should return the error alone.' );
		$this->assertEmpty( $this->service_requests, 'The rejected request should send nothing to the Site Kit service.' );
		$this->assertEqualSetsWithIndex( $timeouts, $this->user_options->get( Survey_Timeouts::OPTION ), 'The rejected request should leave the survey timeouts as they were.' );
		$this->assertEqualSetsWithIndex( $queue, $this->user_options->get( Survey_Queue::OPTION ), 'The rejected request should leave the survey queue as it was.' );
	}
}
