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
			'/' . REST_Routes::REST_ROOT . '/core/user/data/conversion-reporting-settings',

		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertTrue( empty( $get_routes ) );
	}

	public function test_get_routes__with_feature_flag() {
		$this->enable_feature( 'conversionReporting' );
		$this->controller->register();

		$server = rest_get_server();
		$routes = array(
			'/' . REST_Routes::REST_ROOT . '/core/user/data/conversion-reporting-settings',

		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes );
	}
}
