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
		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
	}

	public function test_register_routes() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$this->controller->register();

		$routes = apply_filters( 'googlesitekit_rest_routes', array() );
		$this->assertEquals( 5, count( $routes ) );

		$args = $routes['survey-event']->get_args();
		$this->assertEquals( 'core/user/data/survey-event', $routes['survey-event']->get_uri() );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $args[0]['methods'] );
		$this->assertTrue( is_callable( $args[0]['callback'] ) );
		$this->assertTrue( is_callable( $args[0]['permission_callback'] ) );
		$this->assertTrue( is_array( $args[0]['args'] ) && ! empty( $args[0]['args'] ) );

		$args = $routes['survey-trigger']->get_args();
		$this->assertEquals( 'core/user/data/survey-trigger', $routes['survey-trigger']->get_uri() );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $args[0]['methods'] );
		$this->assertTrue( is_callable( $args[0]['callback'] ) );
		$this->assertTrue( is_callable( $args[0]['permission_callback'] ) );
		$this->assertTrue( is_array( $args[0]['args'] ) && ! empty( $args[0]['args'] ) );

		$args = $routes['survey-timeout']->get_args();
		$this->assertEquals( 'core/user/data/survey-timeout', $routes['survey-timeout']->get_uri() );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $args[0]['methods'] );
		$this->assertTrue( is_callable( $args[0]['callback'] ) );
		$this->assertTrue( is_callable( $args[0]['permission_callback'] ) );
		$this->assertTrue( is_array( $args[0]['args'] ) && ! empty( $args[0]['args'] ) );

		$args = $routes['survey-timeouts']->get_args();
		$this->assertEquals( 'core/user/data/survey-timeouts', $routes['survey-timeouts']->get_uri() );
		$this->assertEquals( \WP_REST_Server::READABLE, $args[0]['methods'] );
		$this->assertTrue( is_callable( $args[0]['callback'] ) );
		$this->assertTrue( is_callable( $args[0]['permission_callback'] ) );

		$args = $routes['survey']->get_args();
		$this->assertEquals( 'core/user/data/survey', $routes['survey']->get_uri() );
		$this->assertEquals( \WP_REST_Server::READABLE, $args[0]['methods'] );
		$this->assertTrue( is_callable( $args[0]['callback'] ) );
		$this->assertTrue( is_callable( $args[0]['permission_callback'] ) );
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

		$this->subscribe_to_wp_http_requests(
			function () {},
			array(
				'response' => array( 'code' => 200 ),
				'headers'  => array(),
				'body'     => wp_json_encode( $survey ),
			)
		);

		$this->fake_proxy_site_connection();
		$response = $this->send_request( 'survey-trigger', array( 'triggerID' => 'test_trigger' ) );

		$this->assertEqualSets( array( 'success' => true ), $response->get_data() );
		$this->assertEqualSets( $survey, $this->queue->front() );
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
			$this->timeouts->get_survey_timeouts()
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

		$this->subscribe_to_wp_http_requests(
			function () {},
			array(
				'response' => array( 'code' => 200 ),
				'headers'  => array(),
				'body'     => '{}',
			)
		);

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
			$this->user_options->get( Survey_Queue::OPTION )
		);
	}

	public function test_survey_timeouts_route() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->timeouts->add( 'foo', 0 );
		$this->timeouts->add( 'bar', 100 );
		$this->timeouts->add( 'baz', -10 );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey-timeouts' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSets(
			array( 'bar' ),
			$response->get_data()
		);
	}

	public function test_survey_timeout() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->timeouts->add( 'foo', 100 );
		$this->timeouts->add( 'baz', -10 );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey-timeout' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'    => 'bar',
					// phpcs icorrectly triggers an error for the following line, thus we need to disable phpcs check for it.
					'timeout' => 100, // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
				),
			)
		);

		$this->assertEqualSets(
			array( 'foo', 'bar' ),
			rest_get_server()->dispatch( $request )->get_data()
		);
	}

	public function test_survey() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

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

		$another_survey = array(
			'survey_id' => 'another_test_survey',
			'session'   => array(
				'session_id'    => 'another_test_session_id',
				'session_token' => 'another_test_session_token',
			),
			'payload'   => array(
				'questions' => array(),
			),
		);

		$this->queue->enqueue( $survey );
		$this->queue->enqueue( $another_survey );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/survey' );
		$response = rest_get_server()->dispatch( $request )->get_data();

		$this->assertEqualSets( array( 'survey' => $survey ), $response );
	}
}
