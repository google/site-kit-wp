<?php
/**
 * Class Google\Site_Kit\Tests\Core\User\REST_Site_Goals_Settings_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\REST_Site_Goals_Settings_Controller;
use Google\Site_Kit\Core\User\Site_Goals_Settings;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

/**
 * @group User
 */
class REST_Site_Goals_Settings_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Site_Goals_Settings instance.
	 *
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	/**
	 * REST_Site_Goals_Settings_Controller instance.
	 *
	 * @var REST_Site_Goals_Settings_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context             = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                   = new Options( $this->context );
		$user_options              = new User_Options( $this->context, $user_id );
		$this->site_goals_settings = new Site_Goals_Settings( $user_options );
		$this->site_goals_settings->register();
		$this->controller = new REST_Site_Goals_Settings_Controller( $this->site_goals_settings );

		$this->grant_view_dashboard_permission( $options, $user_options );
	}

	public function tear_down() {
		parent::tear_down();
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'Expected REST routes filter to be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Expected API fetch preload paths filter to be registered.' );
	}

	public function test_get_routes() {
		$this->controller->register();

		$server     = rest_get_server();
		$routes     = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/site-goals-settings',
		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Expected the Site Goals settings route to be registered.' );
	}

	public function test_get_settings__returns_saved_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$settings = array(
			'goalDrivers'       => array(
				'ecommerce' => array( 'topTrafficChannels' ),
				'lead'      => array( 'visitorType' ),
			),
			'visitorEngagement' => array(
				'ecommerce' => array( 'add_to_cart' ),
				'lead'      => array(),
			),
		);
		$this->site_goals_settings->merge( $settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/site-goals-settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'A user with dashboard access should be able to read their settings.' );
		$this->assertEqualSetsWithIndex( $settings, $response->get_data(), 'The route should return the saved settings.' );
	}

	public function test_save_settings__merges_partial_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->site_goals_settings->merge(
			array(
				'goalDrivers' => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
			)
		);

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/site-goals-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'visitorEngagement' => array(
							'ecommerce' => array( 'add_to_cart' ),
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'A user with dashboard access should be able to save their settings.' );
		// The partial save preserves the existing goalDrivers.
		$this->assertEqualSetsWithIndex(
			array(
				'goalDrivers'       => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
				'visitorEngagement' => array(
					'ecommerce' => array( 'add_to_cart' ),
				),
			),
			$response->get_data(),
			'Saving partial settings should merge with the existing settings.'
		);
	}

	public function test_save_settings__forbidden_without_dashboard_access() {
		// A user who cannot view the dashboard (no edit_posts capability and not
		// authenticated) must not be able to save settings.
		$subscriber_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/site-goals-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'goalDrivers' => array(
							'ecommerce' => array( 'topTrafficChannels' ),
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status(), 'A user without dashboard access should be forbidden from saving.' );
	}

	/**
	 * Grants the current user dashboard access requirements in tests.
	 *
	 * @param Options      $options      Options instance.
	 * @param User_Options $user_options User_Options instance.
	 */
	private function grant_view_dashboard_permission( Options $options, User_Options $user_options ) {
		$this->fake_proxy_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$authentication = new Authentication( $this->context, $options, $user_options );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);
	}
}
