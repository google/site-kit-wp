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
use Google\Site_Kit\Tests\RestTestTriat;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_User_Surveys_ControllerTest extends TestCase {

	use RestTestTriat;

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

	public function set_up() {
		parent::set_up();

		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new Authentication( $context );
		$user_options   = new User_Options( $context, $user->ID );

		$authentication
			->get_oauth_client()
			->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->timeouts   = new Survey_Timeouts( $user_options );
		$this->controller = new REST_User_Surveys_Controller( $authentication, $this->timeouts );
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
		$this->assertEquals( 4, count( $routes ) );

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
					'timeout' => 100, // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
				),
			)
		);

		$this->assertEqualSets(
			array( 'foo', 'bar' ),
			rest_get_server()->dispatch( $request )->get_data()
		);
	}

}
