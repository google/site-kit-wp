<?php
/**
 * REST_Conversion_Tracking_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Conversion_Tracking
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Conversion_Tracking\REST_Conversion_Tracking_Controller;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Conversion_Tracking_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @var Conversion_Tracking_Settings
	 */
	private $settings;

	/**
	 * REST_Conversion_Tracking_Controller instance.
	 *
	 * @var REST_Conversion_Tracking_Controller
	 */
	private $controller;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options       = new Options( $this->context );

		$this->settings   = new Conversion_Tracking_Settings( $options );
		$this->controller = new REST_Conversion_Tracking_Controller( $this->settings );
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

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_get_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		// Set up the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$original_settings = array(
			'enabled' => false,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex( $original_settings, $response->get_data() );
	}

	public function test_get_settings__requires_authenticated_admin() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'enabled' => false,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking' );
		$response = rest_get_server()->dispatch( $request );

		// This admin hasn't authenticated with the Site Kit proxy service yet,
		// so they aren't allowed to modify Conversion Tracking settings.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	public function test_set_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		// Set up the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$original_settings = array(
			'enabled' => false,
		);

		$changed_settings = array(
			'enabled' => true,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $changed_settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEqualSetsWithIndex( $changed_settings, $response->get_data() );
	}

	public function test_set_settings__requires_authenticated_admin() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'enabled' => false,
		);

		$changed_settings = array(
			'enabled' => true,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $changed_settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		// This admin hasn't authenticated with the Site Kit proxy service yet,
		// so they aren't allowed to modify Conversion Tracking settings.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * @dataProvider provider_wrong_settings_data
	 */
	public function test_set_settings__wrong_data( $settings ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	public function provider_wrong_settings_data() {
		return array(
			'wrong data type'                              => array(
				'{}',
			),
			'invalid property'                             => array(
				array( 'some-invalid-property' => 'value' ),
			),
			'non-boolean enabled property'                 => array(
				array( 'enabled' => 123 ),
			),
			'regions property array containing non-string' => array(
				array( 'regions' => array( 123 ) ),
			),
		);
	}

	public function test_get_api_settings__requires_authenticated_admin() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking' );
		$response = rest_get_server()->dispatch( $request );

		// This admin hasn't authenticated with the Site Kit proxy service yet,
		// so they aren't allowed to modify Dashboard Sharing settings.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	private function grant_manage_options_permission() {
		// Setup SiteKit.
		$this->fake_proxy_site_connection();
		// Override any existing filter to make sure the setup is marked as complete all the time.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		// Verify and authenticate the current user.
		$authentication = new Authentication( $this->context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);
	}
}
