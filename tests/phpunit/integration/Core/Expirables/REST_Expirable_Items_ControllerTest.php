<?php
/**
 * REST_Expirable_Items_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Expirables
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Expirables;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Expirables\Expirable_Items;
use Google\Site_Kit\Core\Expirables\REST_Expirable_Items_Controller;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Expirable_Items_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Expirable items instance.
	 *
	 * @var Expirable_Items
	 */
	private $expirable_items;

	/**
	 * Controller instance.
	 *
	 * @var REST_Expirable_Items_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context               = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options          = new User_Options( $context, $user_id );
		$this->expirable_items = new Expirable_Items( $user_options );
		$this->controller      = new REST_Expirable_Items_Controller( $this->expirable_items );
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

	public function test_get_expirable_items() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->expirable_items->add( 'foo', 100 );
		$this->expirable_items->add( 'bar', 100 );
		$this->expirable_items->add( 'baz', -10 );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/expirable-items' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEqualSets(
			array( 'foo', 'bar', 'baz' ),
			array_keys( $data )
		);
	}

	public function test_expirable_item() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->expirable_items->add( 'foo', 100 );
		$this->expirable_items->add( 'baz', -10 );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/set-expirable-item-timers' );
		$request->set_body_params(
			array(
				'data' => array(
					array(
						'slug'       => 'bar',
						'expiration' => 100,
					),
				),
			)
		);

		$data = rest_get_server()->dispatch( $request )->get_data();

		$this->assertEqualSets(
			array( 'foo', 'bar', 'baz' ),
			array_keys( $data )
		);
	}

}
