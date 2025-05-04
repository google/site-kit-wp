<?php
/**
 * REST_Dismissals_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Dismissals
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Dismissals;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Dismissals\REST_Dismissals_Controller;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Dismissals_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Dismissed items instance.
	 *
	 * @var Dismissed_Items
	 */
	private $dismissed_items;

	/**
	 * Controller instance.
	 *
	 * @var REST_Dismissals_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context               = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options          = new User_Options( $context, $user_id );
		$this->dismissed_items = new Dismissed_Items( $user_options );
		$this->controller      = new REST_Dismissals_Controller( $this->dismissed_items );
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

	public function test_get_dismissed_items() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_items->add( 'foo' );
		$this->dismissed_items->add( 'bar', 100 );
		$this->dismissed_items->add( 'baz', -10 );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-items' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSets(
			array( 'foo', 'bar' ),
			$response->get_data()
		);
	}


	/**
	 * @dataProvider provider_dismissed_item_deletions
	 */
	public function test_delete_dismissed_items( $slugs_to_delete, $expected_remaining_items ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_items->add( 'foo' );
		$this->dismissed_items->add( 'bar', 100 );
		$this->dismissed_items->add( 'baz', 200 );

		$this->assertEqualSets(
			array( 'foo', 'bar', 'baz' ),
			array_keys( $this->dismissed_items->get() )
		);

		$request = new WP_REST_Request( 'DELETE', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-items' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => $slugs_to_delete,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSets(
			$expected_remaining_items,
			array_keys( $this->dismissed_items->get() )
		);

		$this->assertEqualSets(
			$expected_remaining_items,
			$response->get_data()
		);
	}


	public function provider_dismissed_item_deletions() {
		return array(
			'slugs as single item string'     => array(
				'foo', // Slugs to delete.
				array( 'bar', 'baz' ), // Expected remaining items.
			),
			'slugs as comma separated string' => array(
				'foo,bar',
				array( 'baz' ),
			),
			'slugs as single item array'      => array(
				array( 'foo' ),
				array( 'bar', 'baz' ),
			),
			'slugs as multiple item array'    => array(
				array( 'foo', 'bar' ),
				array( 'baz' ),
			),
		);
	}

	/**
	 * @dataProvider provider_dismissed_item_deletions__wrong_data
	 */
	public function test_delete_dismissed_items__wrong_data( $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'DELETE', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-items' );
		$request->set_body_params(
			array(
				'data' => $data,
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	public function provider_dismissed_item_deletions__wrong_data() {
		return array(
			'empty object'                                 => array(
				array(),
			),
			'wrong data type'                              => array(
				'{}',
			),
			'invalid property'                             => array(
				array( 'some-invalid-property' => 'value' ),
			),
			'slugs array containing non-string'            => array(
				array( 'slugs' => array( 123 ) ),
			),
			'slugs array containing string and non-string' => array(
				array( 'slugs' => array( '123', 456 ) ),
			),
		);
	}

	public function test_dismiss_item() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_items->add( 'foo' );
		$this->dismissed_items->add( 'baz', -10 );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismiss-item' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'       => 'bar',
					'expiration' => 100,
				),
			)
		);

		$this->assertEqualSets(
			array( 'foo', 'bar' ),
			rest_get_server()->dispatch( $request )->get_data()
		);
	}
}
