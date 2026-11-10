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
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
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
	 * Key_Metrics_Setup_Completed_By instance.
	 *
	 * @var Key_Metrics_Setup_Completed_By
	 */
	private $key_metrics_setup_completed_by;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context                              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options                   = new User_Options( $context );
		$this->user_input                     = new User_Input( $context );
		$this->key_metrics_setup_completed_by = new Key_Metrics_Setup_Completed_By( new Options( $context ) );
		$this->controller                     = new REST_User_Input_Controller(
			$this->user_input,
			new Survey_Queue( $this->user_options ),
			$this->key_metrics_setup_completed_by
		);

		$this->user_input->register();
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue(
			has_filter( 'googlesitekit_rest_routes' ),
			'User input settings REST routes should be registered.'
		);
		$this->assertTrue(
			has_filter( 'googlesitekit_apifetch_preload_paths' ),
			'User input settings endpoint should be added to API fetch preload paths.'
		);
	}

	public function test_get_answers() {
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
				'purpose'                 => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => get_current_user_id(),
				),
				'postFrequency'           => array(
					'scope'  => 'user',
					'values' => array( 'daily' ),
				),
				'goals'                   => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
				'includeConversionEvents' => array(
					'scope'  => 'site',
					'values' => array(),
				),
			),
			$response->get_data(),
			'User input settings response should include the stored site and user answers.'
		);
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/user-input-settings', 'User input settings response should match its resource schema.' );
	}

	public function test_get_answers__answered_by_another_user() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$other_user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		( new User_Input( $context, null, new User_Options( $context, $other_user->ID ) ) )->set_answers(
			array( 'purpose' => array( 'purpose1' ) )
		);

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/user-input-settings' );
		$response = rest_get_server()->dispatch( $request );
		$purpose  = $response->get_data()['purpose'];

		$this->assertEquals( $other_user->ID, $purpose['answeredBy'], 'The purpose answer should name the user who gave it.' );
		$this->assertEquals( $other_user->user_login, $purpose['author']['login'], 'The purpose answer should give the login of the user who gave it.' );
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/user-input-settings', 'User input settings response with an answer by another user should match its resource schema.' );
	}

	public function test_get_answers__answered_by_a_deleted_user() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$other_user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		( new User_Input( $context, null, new User_Options( $context, $other_user_id ) ) )->set_answers(
			array( 'purpose' => array( 'purpose1' ) )
		);
		self::delete_user( $other_user_id );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/user-input-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertFalse( $response->get_data()['purpose']['author']['login'], 'The purpose answer should give no login once the user who gave it is deleted.' );
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/user-input-settings', 'User input settings response with an answer by a deleted user should match its resource schema.' );
	}

	public function test_set_answers() {
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
						'purpose'                 => array( 'purpose1' ),
						'postFrequency'           => array( 'daily' ),
						'goals'                   => array( 'goal1', 'goal2' ),
						'includeConversionEvents' => array( 'contact' ),
					),
				),
			)
		);

		// Ensure KM setup is not completed yet to test below.
		$this->assertFalse(
			$this->key_metrics_setup_completed_by->get(),
			'Key Metrics setup should be incomplete before user input is submitted.'
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSets(
			array(
				'purpose'                 => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => get_current_user_id(),
				),
				'postFrequency'           => array(
					'scope'  => 'user',
					'values' => array( 'daily' ),
				),
				'goals'                   => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
				'includeConversionEvents' => array(
					'scope'      => 'site',
					'values'     => array( 'contact' ),
					'answeredBy' => get_current_user_id(),
				),
			),
			$response->get_data(),
			'User input update response should include the submitted answers with their scopes.'
		);
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/user-input-settings', 'User input update response should match its resource schema.' );

		// Verify that the `user_input_answered_other_survey` survey is dequeued.
		$this->assertEquals(
			array(),
			$this->user_options->get( Survey_Queue::OPTION ),
			'User input survey should be removed from the queue after answers are submitted.'
		);

		// Verify KM setup is marked as completed.
		$this->assertEquals(
			get_current_user_id(),
			$this->key_metrics_setup_completed_by->get(),
			'Submitting user input should record the current user as completing Key Metrics setup.'
		);
	}

	/**
	 * @dataProvider provider_set_answers__invalid_data
	 *
	 * @param array  $body          Request body.
	 * @param string $expected_code Expected error code.
	 */
	public function test_set_answers__invalid_data( $body, $expected_code ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->user_input->set_answers(
			array(
				'purpose' => array( 'purpose1' ),
				'goals'   => array( 'goal1' ),
			)
		);
		$answers = $this->user_input->get_answers();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/user-input-settings' );
		$request->set_body_params( $body );

		$this->assertRESTRequestRejected( $request, $expected_code );
		$this->assertEquals( $answers, $this->user_input->get_answers(), 'User input endpoint should keep the saved answers for invalid data.' );
	}

	public function provider_set_answers__invalid_data() {
		return array(
			'no data'                                   => array(
				array(),
				'rest_missing_callback_param',
			),
			'data is not an object'                     => array(
				array( 'data' => 'purpose1' ),
				'rest_invalid_param',
			),
			'settings is not an object'                 => array(
				array( 'data' => array( 'settings' => 'purpose1' ) ),
				'rest_invalid_param',
			),
			'an answer is not a list'                   => array(
				array(
					'data' => array(
						'settings' => array(
							'purpose'                 => array( 'kind' => 'purpose2' ),
							'postFrequency'           => array( 'daily' ),
							'goals'                   => array( 'goal2' ),
							'includeConversionEvents' => array( 'contact' ),
						),
					),
				),
				'rest_invalid_param',
			),
			'an answer is not a list of strings'        => array(
				array(
					'data' => array(
						'settings' => array(
							'purpose'                 => array( 'purpose2' ),
							'postFrequency'           => array( 'daily' ),
							'goals'                   => array( array( 'goal2' ) ),
							'includeConversionEvents' => array( 'contact' ),
						),
					),
				),
				'rest_invalid_param',
			),
			'settings has a key that is not a question' => array(
				array(
					'data' => array(
						'settings' => array(
							'purpose'                 => array( 'purpose2' ),
							'postFrequency'           => array( 'daily' ),
							'goals'                   => array( 'goal2' ),
							'includeConversionEvents' => array( 'contact' ),
							'favoriteColor'           => array( 'blue' ),
						),
					),
				),
				'rest_invalid_param',
			),
			'data has no settings'                      => array(
				array( 'data' => array() ),
				'rest_invalid_param',
			),
			'settings is empty'                         => array(
				array( 'data' => array( 'settings' => array() ) ),
				'rest_invalid_param',
			),
			'settings leaves out purpose'               => array(
				array(
					'data' => array(
						'settings' => array(
							'postFrequency'           => array( 'daily' ),
							'goals'                   => array( 'goal2' ),
							'includeConversionEvents' => array( 'contact' ),
						),
					),
				),
				'rest_invalid_param',
			),
			'settings leaves out goals'                 => array(
				array(
					'data' => array(
						'settings' => array(
							'purpose'                 => array( 'purpose2' ),
							'postFrequency'           => array( 'daily' ),
							'includeConversionEvents' => array( 'contact' ),
						),
					),
				),
				'rest_invalid_param',
			),
		);
	}
}
