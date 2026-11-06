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
use Google\Site_Kit\Core\REST_API\Schema\Dismissed_Slugs_Schema;
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

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'Dismissals REST routes should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Dismissals preload paths should be registered.' );
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
			$response->get_data(),
			'Dismissed items response should contain non-expired items.'
		);
		$this->assertTrue(
			rest_validate_value_from_schema( $response->get_data(), Dismissed_Slugs_Schema::get() ),
			'Dismissed items response should match its resource schema.'
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
			array_keys( $this->dismissed_items->get() ),
			'Dismissed items should contain all items before deletion.'
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
			array_keys( $this->dismissed_items->get() ),
			'Dismissed items should contain expected remaining items.'
		);

		$this->assertEqualSets(
			$expected_remaining_items,
			$response->get_data(),
			'Delete dismissed items response should contain remaining items.'
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
	 *
	 * @param mixed  $data                          Request data.
	 * @param string $expected_code                 Expected error code.
	 * @param string $rejected_before_callback_from WordPress version from which the schema rejects the request before the route callback runs.
	 */
	public function test_delete_dismissed_items__wrong_data( $data, $expected_code, $rejected_before_callback_from ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_items->add( 'foo' );

		$request = new WP_REST_Request( 'DELETE', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-items' );
		$request->set_body_params(
			array(
				'data' => $data,
			)
		);

		$this->assert_rest_request_rejected( $request, $expected_code, $rejected_before_callback_from );
		$this->assertEquals( array( 'foo' ), $this->dismissed_items->get_dismissed_items(), 'Invalid dismissed items request should remove no item.' );
	}

	public function provider_dismissed_item_deletions__wrong_data() {
		return array(
			'no data'                                      => array(
				null,
				'rest_missing_callback_param',
				'5.2',
			),
			'empty object'                                 => array(
				array(),
				'rest_invalid_param',
				'5.5',
			),
			'wrong data type'                              => array(
				'{}',
				'rest_invalid_param',
				'5.2',
			),
			'invalid property'                             => array(
				array(
					'slugs'                 => array( 'foo' ),
					'some-invalid-property' => 'value',
				),
				'rest_invalid_param',
				'5.2',
			),
			'empty slugs list'                             => array(
				array( 'slugs' => array() ),
				'rest_invalid_param',
				'5.5',
			),
			'slugs array containing non-string'            => array(
				array( 'slugs' => array( 123 ) ),
				'rest_invalid_param',
				'5.2',
			),
			'slugs array containing string and non-string' => array(
				array( 'slugs' => array( '123', 456 ) ),
				'rest_invalid_param',
				'5.2',
			),
		);
	}

	/**
	 * @dataProvider provider_dismissed_item_deletions__data_without_slugs
	 *
	 * @param array $data Request data without slugs.
	 */
	public function test_delete_dismissed_items__callback_rejects_data_without_slugs( $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_items->add( 'foo' );

		$response = $this->call_route_callback( 'DELETE', 'core/user/data/dismissed-items', $data );

		$this->assertWPError( $response, 'Delete dismissed items callback should reject data without slugs.' );
		$this->assertEquals( 'rest_invalid_param', $response->get_error_code(), 'Delete dismissed items callback should report the invalid data parameter.' );
		$this->assertEquals( 400, $response->get_error_data()['status'], 'Delete dismissed items callback should reject data without slugs as a bad request.' );
		$this->assertEquals( array( 'foo' ), $this->dismissed_items->get_dismissed_items(), 'Delete dismissed items callback should remove no item for data without slugs.' );
	}

	public function provider_dismissed_item_deletions__data_without_slugs() {
		return array(
			'data has no slugs'   => array( array() ),
			'slugs list is empty' => array( array( 'slugs' => array() ) ),
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
			rest_get_server()->dispatch( $request )->get_data(),
			'Dismiss item response should contain active dismissed items.'
		);
	}

	/**
	 * @dataProvider provider_dismiss_item__permanent
	 *
	 * @param array $data Request data.
	 */
	public function test_dismiss_item__permanent( $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismiss-item' );
		$request->set_body_params( array( 'data' => $data ) );

		$this->assertEquals( array( 'bar' ), rest_get_server()->dispatch( $request )->get_data(), 'Dismiss item response should contain the dismissed item.' );
		$this->assertSame( 0, $this->dismissed_items->get()['bar'], 'Dismiss item endpoint should dismiss the item permanently.' );
	}

	public function provider_dismiss_item__permanent() {
		return array(
			'expiration is 0'        => array(
				array(
					'slug'       => 'bar',
					'expiration' => 0,
				),
			),
			'expiration is negative' => array(
				array(
					'slug'       => 'bar',
					'expiration' => -1,
				),
			),
			'no expiration'          => array(
				array( 'slug' => 'bar' ),
			),
		);
	}

	/**
	 * @dataProvider provider_dismiss_item__invalid_data
	 *
	 * @param array  $body                          Request body.
	 * @param string $expected_code                 Expected error code.
	 * @param string $rejected_before_callback_from WordPress version from which the schema rejects the request before the route callback runs.
	 */
	public function test_dismiss_item__invalid_data( $body, $expected_code, $rejected_before_callback_from ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismiss-item' );
		$request->set_body_params( $body );

		$this->assert_rest_request_rejected( $request, $expected_code, $rejected_before_callback_from );
		$this->assertEmpty( $this->dismissed_items->get(), 'Dismiss item endpoint should dismiss no item for invalid data.' );
	}

	public function provider_dismiss_item__invalid_data() {
		return array(
			'no data'                      => array(
				array(),
				'rest_missing_callback_param',
				'5.2',
			),
			'data is not an object'        => array(
				array( 'data' => 'foo' ),
				'rest_invalid_param',
				'5.2',
			),
			'slug is not a string'         => array(
				array( 'data' => array( 'slug' => 123 ) ),
				'rest_invalid_param',
				'5.2',
			),
			'expiration is not an integer' => array(
				array(
					'data' => array(
						'slug'       => 'foo',
						'expiration' => 'soon',
					),
				),
				'rest_invalid_param',
				'5.2',
			),
			'data has no slug'             => array(
				array( 'data' => array( 'expiration' => 100 ) ),
				'rest_invalid_param',
				'5.5',
			),
			'slug is empty'                => array(
				array( 'data' => array( 'slug' => '' ) ),
				'rest_invalid_param',
				'5.5',
			),
		);
	}

	/**
	 * @dataProvider provider_dismiss_item__data_without_slug
	 *
	 * @param array $data Request data without a slug.
	 */
	public function test_dismiss_item__callback_rejects_data_without_slug( $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$response = $this->call_route_callback( 'POST', 'core/user/data/dismiss-item', $data );

		$this->assertWPError( $response, 'Dismiss item callback should reject data without a slug.' );
		$this->assertEquals( 'rest_invalid_param', $response->get_error_code(), 'Dismiss item callback should report the invalid data parameter.' );
		$this->assertEquals( 400, $response->get_error_data()['status'], 'Dismiss item callback should reject data without a slug as a bad request.' );
		$this->assertEmpty( $this->dismissed_items->get(), 'Dismiss item callback should dismiss no item for data without a slug.' );
	}

	public function provider_dismiss_item__data_without_slug() {
		return array(
			'data has no slug' => array( array( 'expiration' => 100 ) ),
			'slug is empty'    => array( array( 'slug' => '' ) ),
		);
	}
}
