<?php

/**
 * REST_Audience_Settings_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings;
use Google\Site_Kit\Core\User\REST_Audience_Settings_Controller;
use Google\Site_Kit\Core\User_Input\REST_User_Input_Controller;
use Google\Site_Kit\Core\User_Input\User_Input;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Audience_Settings_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * User_Input instance.
	 *
	 * @var Audience_Settings
	 */
	private $audience_settings;

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

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context                 = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options      = new User_Options( $context );
		$this->audience_settings = new Audience_Settings( $this->user_options );
		$this->controller        = new REST_Audience_Settings_Controller(
			$this->audience_settings
		);

		$this->audience_settings->register();
		$this->grant_dashboard_permission();
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
			'Audience settings REST routes should be registered.'
		);
		$this->assertTrue(
			has_filter( 'googlesitekit_apifetch_preload_paths' ),
			'Audience settings endpoint should be added to API fetch preload paths.'
		);
	}

	public function test_get_routes() {
		$this->controller->register();

		$server = rest_get_server();
		$routes = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings',

		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Audience settings REST route should be registered.' );
	}

	public function test_get_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$saved_settings = array(
			'configuredAudiences'                => array( 'properties/12345678/audiences/12345', 'properties/12345678/audiences/67890' ),
			'isAudienceSegmentationWidgetHidden' => false,
			'didSetAudiences'                    => true,
		);
		$this->audience_settings->set( $saved_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET endpoint should answer with the audience settings.' );
		$this->assertEqualSetsWithIndex( $saved_settings, $response->get_data(), 'GET endpoint should return the saved audience settings.' );
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/audience-settings', 'GET endpoint response should match its resource schema.' );
	}

	public function test_get_settings__defaults() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex(
			array(
				'configuredAudiences'                => null,
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => false,
			),
			$response->get_data(),
			'GET endpoint should return the default audience settings where none are saved.'
		);
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/audience-settings', 'GET endpoint response with the default settings should match its resource schema.' );
	}

	public function test_set_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'configuredAudiences' => array( 'properties/12345678/audiences/12345' ),
						'isAudienceSegmentationWidgetHidden' => false,
						'didSetAudiences'     => false,
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'POST endpoint should accept the settings the dashboard sends.' );
		$this->assertEqualSetsWithIndex(
			array(
				'configuredAudiences'                => array( 'properties/12345678/audiences/12345' ),
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => true,
			),
			$response->get_data(),
			'POST endpoint should save the audiences, and record that the user has picked audiences at least once.'
		);
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/audience-settings', 'POST endpoint response should match its resource schema.' );
	}

	/**
	 * @dataProvider provider_set_settings__invalid_data
	 *
	 * @param array  $body          Request body.
	 * @param string $expected_code Expected error code.
	 */
	public function test_set_settings__invalid_data( $body, $expected_code ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$saved_settings = array(
			'configuredAudiences'                => array( 'properties/12345678/audiences/12345' ),
			'isAudienceSegmentationWidgetHidden' => false,
			'didSetAudiences'                    => true,
		);
		$this->audience_settings->set( $saved_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings' );
		$request->set_body_params( $body );

		$this->assertRESTRequestRejected( $request, $expected_code );
		$this->assertEqualSetsWithIndex( $saved_settings, $this->audience_settings->get(), 'POST endpoint should keep the saved audience settings for invalid data.' );
	}

	public function provider_set_settings__invalid_data() {
		return array(
			'no data'                                  => array(
				array(),
				'rest_missing_callback_param',
			),
			'data has no settings'                     => array(
				array( 'data' => array() ),
				'rest_invalid_param',
			),
			'settings is empty'                        => array(
				array( 'data' => array( 'settings' => array() ) ),
				'rest_invalid_param',
			),
			'settings has a key that is not a setting' => array(
				array( 'data' => array( 'settings' => array( 'favoriteColor' => 'blue' ) ) ),
				'rest_invalid_param',
			),
			'configuredAudiences is not a list'        => array(
				array( 'data' => array( 'settings' => array( 'configuredAudiences' => array( 'name' => 'properties/12345678/audiences/12345' ) ) ) ),
				'rest_invalid_param',
			),
			'configuredAudiences is null'              => array(
				array( 'data' => array( 'settings' => array( 'configuredAudiences' => null ) ) ),
				'rest_invalid_param',
			),
			'the widget flag is not a boolean'         => array(
				array( 'data' => array( 'settings' => array( 'isAudienceSegmentationWidgetHidden' => 'hidden' ) ) ),
				'rest_invalid_param',
			),
		);
	}
}
