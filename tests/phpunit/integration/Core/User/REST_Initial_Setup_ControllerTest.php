<?php
/**
 * REST_Initial_Setup_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Initial_Setup_Settings;
use Google\Site_Kit\Core\User\REST_Initial_Setup_Controller;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Initial_Setup_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Initial_Setup_Settings instance.
	 *
	 * @var Initial_Setup_Settings
	 */
	private $initial_setup_settings;

	/**
	 * REST_Initial_Setup_Controller instance.
	 *
	 * @var REST_Initial_Setup_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context                      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options                 = new User_Options( $context );
		$this->initial_setup_settings = new Initial_Setup_Settings( $user_options );
		$this->controller             = new REST_Initial_Setup_Controller( $this->initial_setup_settings );

		$this->initial_setup_settings->register();
	}

	public function tear_down() {
		parent::tear_down();
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'Expected REST routes filter to be registered for initial setup settings' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Expected API fetch preload paths filter to be registered for initial setup settings' );
	}

	public function test_get_routes() {
		$this->controller->register();

		$server     = rest_get_server();
		$routes     = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/initial-setup-settings',
		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Expected route for initial setup settings to be registered' );
	}

	public function test_get_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$saved_settings = array(
			'isAnalyticsSetupComplete' => true,
			'hasSitePurposeAnswer'     => false,
		);
		$this->initial_setup_settings->set( $saved_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/initial-setup-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET endpoint should answer with the initial setup settings.' );
		$this->assertEqualSetsWithIndex( $saved_settings, $response->get_data(), 'GET endpoint should return the saved initial setup settings.' );
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/initial-setup-settings', 'GET endpoint response should match its resource schema.' );
	}

	public function test_get_settings__defaults() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/initial-setup-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex(
			array(
				'isAnalyticsSetupComplete' => null,
				'hasSitePurposeAnswer'     => null,
			),
			$response->get_data(),
			'GET endpoint should return no value for either setting where none is saved.'
		);
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/initial-setup-settings', 'GET endpoint response with the default settings should match its resource schema.' );
	}

	/**
	 * @dataProvider provider_set_settings
	 *
	 * @param array $settings Settings a setup flow sends.
	 */
	public function test_set_settings( $settings ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/initial-setup-settings' );
		$request->set_body_params( array( 'data' => array( 'settings' => $settings ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'POST endpoint should accept the settings a setup flow sends.' );
		$this->assertEqualSetsWithIndex( $settings, $response->get_data(), 'POST endpoint should save the settings it gets.' );
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/initial-setup-settings', 'POST endpoint response should match its resource schema.' );
	}

	public function provider_set_settings() {
		return array(
			'the setup with Analytics starts' => array(
				array(
					'isAnalyticsSetupComplete' => false,
					'hasSitePurposeAnswer'     => false,
				),
			),
			'the site purpose step ends'      => array(
				array(
					'isAnalyticsSetupComplete' => true,
					'hasSitePurposeAnswer'     => true,
				),
			),
		);
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
			'isAnalyticsSetupComplete' => true,
			'hasSitePurposeAnswer'     => false,
		);
		$this->initial_setup_settings->set( $saved_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/initial-setup-settings' );
		$request->set_body_params( $body );

		$this->assertRESTRequestRejected( $request, $expected_code );
		$this->assertEqualSetsWithIndex( $saved_settings, $this->initial_setup_settings->get(), 'POST endpoint should keep the saved settings for invalid data.' );
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
			'a setting is not a boolean'               => array(
				array( 'data' => array( 'settings' => array( 'hasSitePurposeAnswer' => 'answered' ) ) ),
				'rest_invalid_param',
			),
			'a setting is null'                        => array(
				array( 'data' => array( 'settings' => array( 'isAnalyticsSetupComplete' => null ) ) ),
				'rest_invalid_param',
			),
		);
	}
}
