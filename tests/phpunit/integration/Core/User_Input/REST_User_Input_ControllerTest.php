<?php
/**
 * REST_User_Input_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Input\REST_User_Input_Controller;
use Google\Site_Kit\Core\User_Input\User_Input;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_User_Input_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * User_Input instance.
	 *
	 * @var User_Input
	 */
	private $user_input;

	/**
	 * REST_User_Input_Controller instance.
	 *
	 * @var REST_User_Input_Controller
	 */
	private $controller;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Key_Metrics_Setup_Completed instance.
	 *
	 * @var Key_Metrics_Setup_Completed
	 */
	private $key_metrics_setup_completed;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context                           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options                = new User_Options( $context );
		$this->user_input                  = new User_Input( $context );
		$this->key_metrics_setup_completed = new Key_Metrics_Setup_Completed( new Options( $context ) );
		$this->controller                  = new REST_User_Input_Controller(
			$this->user_input,
			new Survey_Queue( $this->user_options ),
			$this->key_metrics_setup_completed
		);

		$this->user_input->register();
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		$this->enable_feature( 'userInput' );

		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_get_answers() {
		$this->enable_feature( 'userInput' );
		$this->user_input->register();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->user_input->set_answers(
			array(
				'purpose'       => array( 'purpose1' ),
				'postFrequency' => array( 'daily' ),
				'goals'         => array( 'goal1', 'goal2' ),
			)
		);

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/user-input-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSets(
			array(
				'purpose'       => array(
					'scope'  => 'site',
					'values' => array( 'purpose1' ),
				),
				'postFrequency' => array(
					'scope'  => 'user',
					'values' => array( 'daily' ),
				),
				'goals'         => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			),
			$response->get_data()
		);
	}

	public function test_set_answers() {
		$this->enable_feature( 'userInput' );
		$this->user_input->register();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// The REST request here is supposed to dequeue the the
		// `user_input_answered_other_survey` from the survey queue if it exists.
		// This is added to the queue so that its removal can be tested.
		$this->user_options->set(
			Survey_Queue::OPTION,
			array(
				array(
					'survey_id' => 'user_input_answered_other_survey',
					'payload'   => array(),
					'session'   => array(
						'session_id'    => 'test_session_id_1',
						'session_token' => 'test_session_token_1',
					),
				),
			)
		);

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/user-input-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'purpose'       => array( 'purpose1' ),
						'postFrequency' => array( 'daily' ),
						'goals'         => array( 'goal1', 'goal2' ),
					),
				),
			)
		);

		// Ensure KM setup is not completed yet to test below.
		$this->assertFalse( $this->key_metrics_setup_completed->get() );

		$this->assertEqualSets(
			array(
				'purpose'       => array(
					'scope'  => 'site',
					'values' => array( 'purpose1' ),
				),
				'postFrequency' => array(
					'scope'  => 'user',
					'values' => array( 'daily' ),
				),
				'goals'         => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			),
			rest_get_server()->dispatch( $request )->get_data()
		);

		// Verify that the `user_input_answered_other_survey` survey is dequeued.
		$this->assertEquals(
			array(),
			$this->user_options->get( Survey_Queue::OPTION )
		);

		// Verify KM setup is marked as completed.
		$this->assertTrue( $this->key_metrics_setup_completed->get() );
	}
}
