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
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/conversion-reporting-settings', 'GET endpoint response should match its resource schema.' );
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
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/conversion-reporting-settings', 'POST endpoint response should match its resource schema.' );
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
	 * @param array  $body          Request body.
	 * @param string $expected_code Expected error code.
	 */
	public function test_set_settings__invalid_data( $body, $expected_code ) {
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

		$this->assertRESTRequestRejected( $request, $expected_code );
		$this->assertEqualSetsWithIndex( $saved_settings, $this->conversion_reporting_settings->get(), 'POST endpoint should keep the saved settings for invalid data.' );
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
			'a time is not an integer'                 => array(
				array( 'data' => array( 'settings' => array( 'newEventsCalloutDismissedAt' => 'today' ) ) ),
				'rest_invalid_param',
			),
		);
	}
}
