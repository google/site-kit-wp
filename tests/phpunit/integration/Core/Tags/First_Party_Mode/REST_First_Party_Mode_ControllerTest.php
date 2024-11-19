<?php
/**
 * REST_First_Party_Mode_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\First_Party_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\First_Party_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Settings;
use Google\Site_Kit\Core\Tags\First_Party_Mode\REST_First_Party_Mode_Controller;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_First_Party_Mode_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;

	/**
	 * First_Party_Mode_Settings instance.
	 *
	 * @var First_Party_Mode_Settings
	 */
	private $settings;

	/**
	 * REST_First_Party_Mode_Controller instance.
	 *
	 * @var REST_First_Party_Mode_Controller
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

		$this->settings   = new First_Party_Mode_Settings( $options );
		$this->controller = new REST_First_Party_Mode_Controller( $this->settings );
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
			'isEnabled'             => null,
			'isFPMHealthy'          => null,
			'isScriptAccessEnabled' => null,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex( $original_settings, $response->get_data() );
	}

	public function test_get_settings__requires_authenticated_admin() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'isEnabled'             => null,
			'isFPMHealthy'          => null,
			'isScriptAccessEnabled' => null,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-settings' );
		$response = rest_get_server()->dispatch( $request );

		// This request is made by a user who is not authenticated with dashboard
		// view permissions and is therefore forbidden.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	public function test_set_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		// Set up the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$original_settings = array(
			'isEnabled'             => null,
			'isFPMHealthy'          => null,
			'isScriptAccessEnabled' => null,
		);

		$changed_settings = array(
			'isEnabled'             => true,
			'isFPMHealthy'          => null,
			'isScriptAccessEnabled' => null,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'isEnabled' => true,
					),
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
			'isEnabled'             => null,
			'isFPMHealthy'          => null,
			'isScriptAccessEnabled' => null,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'isEnabled' => true,
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		// This request is made by a user who is not authenticated with dashboard
		// view permissions and is therefore forbidden.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * @dataProvider provider_wrong_settings_data
	 */
	public function test_set_settings__wrong_data( $settings ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-settings' );
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
			'wrong data type'              => array(
				'{}',
			),
			'invalid property'             => array(
				array( 'some-invalid-property' => 'value' ),
			),
			'non-boolean enabled property' => array(
				array( 'isEnabled' => 123 ),
			),
		);
	}

	/**
	 * @dataProvider provider_fpm_server_requirement_status_data
	 */
	public function test_get_fpm_server_requirement_status( $data ) {
		$endpoint_responses = $data['endpoint_responses'];
		$expected_settings  = $data['expected_settings'];

		// Here we mock the `is_endpoint_healthy()` method of the controller. This is necessary because, although we could
		// mock `file_get_contents()`, it's not possible to mock the `$http_response_header` variable used within the scope
		// of the `is_endpoint_healthy()` method. The rest of the controller's behaviour remains unmocked.
		$mock_controller = $this->getMockBuilder( REST_First_Party_Mode_Controller::class )
			->setConstructorArgs( array( $this->settings ) )
			->onlyMethods( array( 'is_endpoint_healthy' ) )
			->getMock();

		$expected_calls = array_map(
			function ( $url ) use ( $endpoint_responses ) {
				return array( $url => $endpoint_responses[ $url ] );
			},
			array_keys( $endpoint_responses ),
		);

		$call_count = 0;

		$mock_controller->expects( $this->exactly( 2 ) )
			->method( 'is_endpoint_healthy' )
			->willReturnCallback(
				function ( $url ) use ( &$call_count, $expected_calls ) {
					// Verify the argument matches what we expect.
					$expected_url = array_keys( $expected_calls[ $call_count ] )[0];
					$this->assertEquals( $expected_url, $url, 'Call #' . ( $call_count + 1 ) . ' received unexpected URL' );

					// Return the corresponding response.
					$result = array_values( $expected_calls[ $call_count ] )[0];
					$call_count++;
					return $result;
				}
			);

		remove_all_filters( 'googlesitekit_rest_routes' );
		/**
		 * @var REST_First_Party_Mode_Controller $mock_controller
		 */
		$mock_controller->register();
		$this->register_rest_routes();
		// Set up the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$this->settings->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-server-requirement-status' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => null,
				'isFPMHealthy'          => $expected_settings['isFPMHealthy'],
				'isScriptAccessEnabled' => $expected_settings['isScriptAccessEnabled'],
			),
			$response->get_data()
		);
	}

	public function provider_fpm_server_requirement_status_data() {
		return array(
			'FPS service healthy, proxy script healthy'   => array(
				array(
					'endpoint_responses' => array(
						'https://g-1234.fps.goog/mpath/healthy' => true,
						'http://example.org/wp-content/plugins/google-site-kit/fpm/measurement.php?healthCheck=1' => true,
					),
					'expected_settings'  => array(
						'isFPMHealthy'          => true,
						'isScriptAccessEnabled' => true,
					),
				),
			),
			'FPS service healthy, proxy script unhealthy' => array(
				array(
					'endpoint_responses' => array(
						'https://g-1234.fps.goog/mpath/healthy' => true,
						'http://example.org/wp-content/plugins/google-site-kit/fpm/measurement.php?healthCheck=1' => false,
					),
					'expected_settings'  => array(
						'isFPMHealthy'          => true,
						'isScriptAccessEnabled' => false,
					),
				),
			),
			'FPS service unhealthy, proxy script healthy' => array(
				array(
					'endpoint_responses' => array(
						'https://g-1234.fps.goog/mpath/healthy' => false,
						'http://example.org/wp-content/plugins/google-site-kit/fpm/measurement.php?healthCheck=1' => true,
					),
					'expected_settings'  => array(
						'isFPMHealthy'          => false,
						'isScriptAccessEnabled' => true,
					),
				),
			),
			'FPS service unhealthy, proxy script unhealthy' => array(
				array(
					'endpoint_responses' => array(
						'https://g-1234.fps.goog/mpath/healthy' => false,
						'http://example.org/wp-content/plugins/google-site-kit/fpm/measurement.php?healthCheck=1' => false,
					),
					'expected_settings'  => array(
						'isFPMHealthy'          => false,
						'isScriptAccessEnabled' => false,
					),
				),
			),
		);
	}

	public function test_get_fpm_server_requirement_status__requires_authenticated_admin() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-server-requirement-status' );
		$response = rest_get_server()->dispatch( $request );

		// This request is made by a user who is not authenticated with dashboard
		// view permissions and is therefore forbidden.
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
