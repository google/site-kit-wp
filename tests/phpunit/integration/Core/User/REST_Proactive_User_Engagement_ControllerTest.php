<?php
/**
 * REST_Proactive_User_Engagement_ControllerTest
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
use Google\Site_Kit\Core\User\Proactive_User_Engagement_Settings;
use Google\Site_Kit\Core\User\REST_Proactive_User_Engagement_Controller;
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
		$user_options     = new User_Options( $context );
		$this->settings   = new Proactive_User_Engagement_Settings( $user_options );
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
			'/' . REST_Routes::REST_ROOT . '/core/user/data/proactive-user-engagement-settings',
		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Expected route for user proactive user engagement settings to be registered' );
	}
}
