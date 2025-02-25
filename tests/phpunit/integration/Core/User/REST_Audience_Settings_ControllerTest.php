<?php
/**
 * REST_Audience_Settings_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings;
use Google\Site_Kit\Core\User\REST_Audience_Settings_Controller;
use Google\Site_Kit\Core\User_Input\REST_User_Input_Controller;
use Google\Site_Kit\Core\User_Input\User_Input;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Audience_Settings_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * User_Input instance.
	 *
	 * @var Audience_Settings
	 */
	private $audience_settings;

	/**
	 * REST_User_Input_Controller instance.
	 *
	 * @var REST_User_Input_Controller
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

		$context                 = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options      = new User_Options( $context );
		$this->audience_settings = new Audience_Settings( $this->user_options );
		$this->controller        = new REST_Audience_Settings_Controller(
			$this->audience_settings
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

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_get_routes__no_feature_flag() {
		$this->controller->register();

		$server = rest_get_server();
		$routes = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings',

		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertTrue( empty( $get_routes ) );
	}

	public function test_get_routes__with_feature_flag() {
		$this->controller->register();

		$server = rest_get_server();
		$routes = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings',

		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes );
	}
}
