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
use Google\Site_Kit\Core\User_Surveys\REST_User_Surveys_Controller;
use Google\Site_Kit\Tests\TestCase;

class REST_User_Surveys_ControllerTest extends TestCase {

	/**
	 * REST_User_Surveys_Controller object.
	 *
	 * @var REST_User_Surveys_Controller
	 */
	private $controller;

	public function setUp() {
		parent::setUp();

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication   = new Authentication( $context );
		$this->controller = new REST_User_Surveys_Controller( $authentication );
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
		$this->assertEquals( 2, count( $routes ) );

		$survey_event_args = $routes['survey-event']->get_args();
		$this->assertEquals( 'core/user/data/survey-event', $routes['survey-event']->get_uri() );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $survey_event_args[0]['methods'] );
		$this->assertTrue( is_callable( $survey_event_args[0]['callback'] ) );
		$this->assertTrue( is_callable( $survey_event_args[0]['permission_callback'] ) );
		$this->assertTrue( is_array( $survey_event_args[0]['args'] ) && ! empty( $survey_event_args[0]['args'] ) );

		$survey_trigger_args = $routes['survey-trigger']->get_args();
		$this->assertEquals( 'core/user/data/survey-trigger', $routes['survey-trigger']->get_uri() );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $survey_trigger_args[0]['methods'] );
		$this->assertTrue( is_callable( $survey_trigger_args[0]['callback'] ) );
		$this->assertTrue( is_callable( $survey_trigger_args[0]['permission_callback'] ) );
		$this->assertTrue( is_array( $survey_trigger_args[0]['args'] ) && ! empty( $survey_trigger_args[0]['args'] ) );
	}

}
