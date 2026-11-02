<?php
/**
 * REST_Conversion_Reporting_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Conversion_Reporting_Settings;
use Google\Site_Kit\Core\User\REST_Conversion_Reporting_Controller;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Conversion_Reporting_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Conversion_Reporting_Settings instance.
	 *
	 * @var Conversion_Reporting_Settings
	 */
	private $conversion_reporting_settings;

	/**
	 * REST_Conversion_Reporting_Controller instance.
	 *
	 * @var REST_Conversion_Reporting_Controller
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

		$context                             = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options                  = new User_Options( $context );
		$this->conversion_reporting_settings = new Conversion_Reporting_Settings( $this->user_options );
		$this->controller                    = new REST_Conversion_Reporting_Controller(
			$this->conversion_reporting_settings
		);

		$this->conversion_reporting_settings->register();
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
			'Conversion reporting settings REST routes should be registered.'
		);
		$this->assertTrue(
			has_filter( 'googlesitekit_apifetch_preload_paths' ),
			'Conversion reporting settings endpoint should be added to API fetch preload paths.'
		);
	}

	public function test_get_routes() {
		$this->controller->register();

		$server = rest_get_server();
		$routes = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/conversion-reporting-settings',

		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Conversion reporting settings REST route should be registered.' );
	}

	public function test_get_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$saved_settings = array(
			'newEventsCalloutDismissedAt'  => 1730000000,
			'lostEventsCalloutDismissedAt' => 0,
		);
		$this->conversion_reporting_settings->set( $saved_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/conversion-reporting-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET endpoint should answer with the conversion reporting settings.' );
		$this->assertEqualSetsWithIndex( $saved_settings, $response->get_data(), 'GET endpoint should return the saved conversion reporting settings.' );
		$this->assert_matches_route_resource_schema( $response->get_data(), 'core/user/data/conversion-reporting-settings', 'GET endpoint response should match its resource schema.' );
	}

	/**
	 * @dataProvider provider_set_settings
	 *
	 * @param array $settings          Settings the dashboard sends.
	 * @param array $expected_settings Settings the endpoint returns.
	 */
	public function test_set_settings( $settings, $expected_settings ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/conversion-reporting-settings' );
		$request->set_body_params( array( 'data' => array( 'settings' => $settings ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'POST endpoint should accept the settings the dashboard sends.' );
		$this->assertEqualSetsWithIndex( $expected_settings, $response->get_data(), 'POST endpoint should save the dismissal times it gets.' );
		$this->assert_matches_route_resource_schema( $response->get_data(), 'core/user/data/conversion-reporting-settings', 'POST endpoint response should match its resource schema.' );
	}

	public function provider_set_settings() {
		return array(
			'the new events callout'  => array(
				array( 'newEventsCalloutDismissedAt' => 1730000000 ),
				array(
					'newEventsCalloutDismissedAt'  => 1730000000,
					'lostEventsCalloutDismissedAt' => 0,
				),
			),
			'the lost events callout' => array(
				array(
					'newEventsCalloutDismissedAt'  => 1730000000,
					'lostEventsCalloutDismissedAt' => 1730000000,
				),
				array(
					'newEventsCalloutDismissedAt'  => 1730000000,
					'lostEventsCalloutDismissedAt' => 1730000000,
				),
			),
		);
	}

	/**
	 * @dataProvider provider_set_settings__invalid_data
	 *
	 * @param array  $body                          Request body.
	 * @param string $expected_code                 Expected error code.
	 * @param string $rejected_before_callback_from WordPress version from which the schema rejects the request before the route callback runs.
	 */
	public function test_set_settings__invalid_data( $body, $expected_code, $rejected_before_callback_from ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$saved_settings = array(
			'newEventsCalloutDismissedAt'  => 1730000000,
			'lostEventsCalloutDismissedAt' => 0,
		);
		$this->conversion_reporting_settings->set( $saved_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/conversion-reporting-settings' );
		$request->set_body_params( $body );

		$this->assert_rest_request_rejected( $request, $expected_code, $rejected_before_callback_from );
		$this->assertEqualSetsWithIndex( $saved_settings, $this->conversion_reporting_settings->get(), 'POST endpoint should keep the saved settings for invalid data.' );
	}

	public function provider_set_settings__invalid_data() {
		return array(
			'no data'                                  => array(
				array(),
				'rest_missing_callback_param',
				'5.2',
			),
			'data has no settings'                     => array(
				array( 'data' => array() ),
				'rest_invalid_param',
				'5.5',
			),
			'settings is empty'                        => array(
				array( 'data' => array( 'settings' => array() ) ),
				'rest_invalid_param',
				'5.6',
			),
			'settings has a key that is not a setting' => array(
				array( 'data' => array( 'settings' => array( 'favoriteColor' => 'blue' ) ) ),
				'rest_invalid_param',
				'5.2',
			),
			'a time is not an integer'                 => array(
				array( 'data' => array( 'settings' => array( 'newEventsCalloutDismissedAt' => 'today' ) ) ),
				'rest_invalid_param',
				'5.2',
			),
		);
	}

	/**
	 * @dataProvider provider_set_settings__data_the_callback_rejects
	 *
	 * @param array $data Request data that WordPress before 5.5, or before 5.6 for an empty `settings`, lets through to the callback.
	 */
	public function test_set_settings__callback_rejects_invalid_data( $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$saved_settings = array(
			'newEventsCalloutDismissedAt'  => 1730000000,
			'lostEventsCalloutDismissedAt' => 0,
		);
		$this->conversion_reporting_settings->set( $saved_settings );

		$response = $this->call_route_callback( 'POST', 'core/user/data/conversion-reporting-settings', $data );

		$this->assertWPError( $response, 'Conversion reporting callback should reject invalid data.' );
		$this->assertEquals( 'rest_invalid_param', $response->get_error_code(), 'Conversion reporting callback should report the invalid data parameter.' );
		$this->assertEquals( 400, $response->get_error_data()['status'], 'Conversion reporting callback should reject invalid data as a bad request.' );
		$this->assertEqualSetsWithIndex( $saved_settings, $this->conversion_reporting_settings->get(), 'Conversion reporting callback should keep the saved settings for invalid data.' );
	}

	public function provider_set_settings__data_the_callback_rejects() {
		return array(
			'data has no settings' => array( array() ),
			'settings is empty'    => array( array( 'settings' => array() ) ),
		);
	}
}
