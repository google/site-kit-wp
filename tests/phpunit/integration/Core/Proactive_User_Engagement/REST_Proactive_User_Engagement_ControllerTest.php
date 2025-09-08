<?php
/**
 * REST_Proactive_User_Engagement_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Proactive_User_Engagement
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Proactive_User_Engagement;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Proactive_User_Engagement\Proactive_User_Engagement_Settings;
use Google\Site_Kit\Core\Proactive_User_Engagement\REST_Proactive_User_Engagement_Controller;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;

class REST_Proactive_User_Engagement_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Proactive_User_Engagement_Settings instance.
	 *
	 * @var Proactive_User_Engagement_Settings
	 */
	private $settings;

	/**
	 * REST_Proactive_User_Engagement_Controller instance.
	 *
	 * @var REST_Proactive_User_Engagement_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options          = new Options( $context );
		$this->settings   = new Proactive_User_Engagement_Settings( $options );
		$this->controller = new REST_Proactive_User_Engagement_Controller( $this->settings );
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

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'Expected REST routes filter to be registered' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Expected API fetch preload paths filter to be registered' );
	}

	public function test_get_routes() {
		$this->controller->register();

		$server     = rest_get_server();
		$routes     = array(
			'/' . REST_Routes::REST_ROOT . '/core/site/data/proactive-user-engagement',
		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Expected route for site proactive user engagement settings to be registered' );
	}

	public function test_get_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'enabled' => false,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/proactive-user-engagement' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex( $original_settings, $response->get_data(), 'GET should return the current site settings' );
	}

	public function test_set_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/proactive-user-engagement' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'enabled' => false,
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status(), 'POST should update and return 200' );
		$this->assertEqualSetsWithIndex( array( 'enabled' => false ), $response->get_data(), 'POST should return updated settings' );
	}

	/**
	 * @dataProvider provider_wrong_data
	 */
	public function test_set_settings__wrong_data( $settings ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/proactive-user-engagement' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 400, $response->get_status(), 'Invalid payload should return 400' );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'], 'Invalid payload should return rest_invalid_param' );
	}

	public function provider_wrong_data() {
		return array(
			'wrong data type'            => array( '{}' ),
			'invalid property'           => array( array( 'some-invalid-property' => 'value' ) ),
			'non-boolean enabled'        => array( array( 'enabled' => 123 ) ),
			'missing required `enabled`' => array( array() ),
		);
	}
}
