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
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Expirables\Expirable_Items;
use Google\Site_Kit\Core\Expirables\REST_Expirable_Items_Controller;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\REST_API\Schema\Expirable_Items_Schema;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Core\Storage\Options;

class REST_Expirable_Items_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
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

		$this->context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options          = new User_Options( $this->context, $user_id );
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

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'Controller should register expirable items REST routes.' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Controller should register expirable items preload paths.' );
	}

	public function test_get_expirable_items() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->grant_manage_options_permission();

		$this->expirable_items->add( 'foo', 100 );
		$this->expirable_items->add( 'bar', 100 );
		$this->expirable_items->add( 'baz', -10 );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/expirable-items' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEqualsWithDelta( time() + 100, $data['foo'], 2, 'GET endpoint should return foo timer.' );
		$this->assertEqualsWithDelta( time() + 100, $data['bar'], 2, 'GET endpoint should return bar timer.' );
		$this->assertEqualsWithDelta( time() - 10, $data['baz'], 2, 'GET endpoint should return expired baz timer.' );
		$this->assertTrue(
			rest_validate_value_from_schema( $data, Expirable_Items_Schema::get() ),
			'GET endpoint response should match its resource schema.'
		);
	}

	public function test_set_expirable_item_timers() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->grant_manage_options_permission();

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
					array(
						'slug'       => 'qux',
						'expiration' => 1,
					),
				),
			)
		);

		$data = rest_get_server()->dispatch( $request )->get_data();

		$this->assertEqualsWithDelta( time() + 100, $data['foo'], 2, 'Timer update endpoint should preserve foo timer.' );
		$this->assertEqualsWithDelta( time() - 10, $data['baz'], 2, 'Timer update endpoint should preserve expired baz timer.' );
		$this->assertEqualsWithDelta( time() + 100, $data['bar'], 2, 'Timer update endpoint should set the bar timer.' );
		$this->assertEqualsWithDelta( time() + 1, $data['qux'], 2, 'Timer update endpoint should set the qux timer.' );
	}

	/**
	 * @dataProvider provider_set_expirable_item_timers__invalid_data
	 *
	 * @param array  $body                          Request body.
	 * @param string $expected_code                 Expected error code.
	 * @param string $rejected_before_callback_from WordPress version from which the schema rejects the request before the route callback runs.
	 */
	public function test_set_expirable_item_timers__invalid_data( $body, $expected_code, $rejected_before_callback_from ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->grant_manage_options_permission();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/set-expirable-item-timers' );
		$request->set_body_params( $body );

		$this->assert_rest_request_rejected( $request, $expected_code, $rejected_before_callback_from );
		$this->assertEmpty( $this->expirable_items->get(), 'Timer update endpoint should set no timer for invalid data.' );
	}

	public function provider_set_expirable_item_timers__invalid_data() {
		return array(
			'no data'                           => array(
				array(),
				'rest_missing_callback_param',
				'5.2',
			),
			'data is not a list of items'       => array(
				array( 'data' => 'foo' ),
				'rest_invalid_param',
				'5.2',
			),
			'item slug is not a string'         => array(
				array(
					'data' => array(
						array(
							'slug'       => 123,
							'expiration' => 100,
						),
					),
				),
				'rest_invalid_param',
				'5.2',
			),
			'item expiration is not an integer' => array(
				array(
					'data' => array(
						array(
							'slug'       => 'foo',
							'expiration' => 'soon',
						),
					),
				),
				'rest_invalid_param',
				'5.2',
			),
			'item expiration is 0'              => array(
				array(
					'data' => array(
						array(
							'slug'       => 'foo',
							'expiration' => 0,
						),
					),
				),
				'rest_invalid_param',
				'5.2',
			),
			'item has another property'         => array(
				array(
					'data' => array(
						array(
							'slug'       => 'foo',
							'expiration' => 100,
							'other'      => 'value',
						),
					),
				),
				'rest_invalid_param',
				'5.2',
			),
			'empty list'                        => array(
				array( 'data' => array() ),
				'rest_invalid_param',
				'5.5',
			),
			'item has no slug'                  => array(
				array( 'data' => array( array( 'expiration' => 100 ) ) ),
				'rest_invalid_param',
				'5.5',
			),
			'item slug is empty'                => array(
				array(
					'data' => array(
						array(
							'slug'       => '',
							'expiration' => 100,
						),
					),
				),
				'rest_invalid_param',
				'5.5',
			),
			'item has no expiration'            => array(
				array( 'data' => array( array( 'slug' => 'foo' ) ) ),
				'rest_invalid_param',
				'5.5',
			),
		);
	}

	/**
	 * @dataProvider provider_set_expirable_item_timers__items_without_values
	 *
	 * @param array $data List of items with a missing or empty value.
	 */
	public function test_set_expirable_item_timers__callback_rejects_items_without_values( $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$response = $this->call_route_callback( 'POST', 'core/user/data/set-expirable-item-timers', $data );

		$this->assertWPError( $response, 'Timer update callback should reject items with a missing value.' );
		$this->assertEquals( 'rest_invalid_param', $response->get_error_code(), 'Timer update callback should report the invalid data parameter.' );
		$this->assertEquals( 400, $response->get_error_data()['status'], 'Timer update callback should reject items with a missing value as a bad request.' );
		$this->assertEmpty( $this->expirable_items->get(), 'Timer update callback should set no timer when one item has a missing value.' );
	}

	public function provider_set_expirable_item_timers__items_without_values() {
		return array(
			'empty list'                    => array( array() ),
			'item has no slug'              => array( array( array( 'expiration' => 100 ) ) ),
			'item slug is empty'            => array(
				array(
					array(
						'slug'       => '',
						'expiration' => 100,
					),
				),
			),
			'item has no expiration'        => array( array( array( 'slug' => 'foo' ) ) ),
			'good item before an empty one' => array(
				array(
					array(
						'slug'       => 'foo',
						'expiration' => 100,
					),
					array(),
				),
			),
		);
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
