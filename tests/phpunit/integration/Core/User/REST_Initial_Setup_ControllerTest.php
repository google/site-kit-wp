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
}
