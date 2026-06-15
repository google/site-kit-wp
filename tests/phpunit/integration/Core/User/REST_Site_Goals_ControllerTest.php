<?php
/**
 * REST_Site_Goals_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\REST_Site_Goals_Controller;
use Google\Site_Kit\Core\User\Site_Goals_Settings;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;

class REST_Site_Goals_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Site_Goals_Settings instance.
	 *
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	/**
	 * REST_Site_Goals_Controller instance.
	 *
	 * @var REST_Site_Goals_Controller
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

		$context                   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options        = new User_Options( $context );
		$this->site_goals_settings = new Site_Goals_Settings( $this->user_options );
		$this->controller          = new REST_Site_Goals_Controller(
			$this->site_goals_settings
		);
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

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'The REST routes filter should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'The preload paths filter should be registered.' );
	}

	public function test_get_routes() {
		$this->controller->register();

		$server     = rest_get_server();
		$routes     = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/site-goals-settings',
		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'The site-goals-settings REST route should be registered.' );
	}
}
