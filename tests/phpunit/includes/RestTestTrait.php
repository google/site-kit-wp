<?php
/**
 * RestTestTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Core\REST_API\REST_Routes;
use MockAction;
use WP_REST_Request;

trait RestTestTrait {

	protected function register_rest_routes() {
		$routes = apply_filters( 'googlesitekit_rest_routes', array() );
		$this->assertNotEmpty( $routes, 'At least one Site Kit REST route should be registered for the test.' );

		// Avoid test failing due to "_doing_it_wrong" notice.
		// Routes must be registered on `rest_api_init` action.
		add_action(
			'rest_api_init',
			function () use ( $routes ) {
				foreach ( $routes as $route ) {
					$route->register();
				}
			}
		);

		rest_get_server();

		return $routes;
	}

	/**
	 * Dispatches a REST request, and asserts that it fails with a 400 and the given error code.
	 *
	 * From the given WordPress version on, it also asserts that the route's callback never ran.
	 * An older version lets some invalid data through to the callback's own check.
	 *
	 * @param WP_REST_Request $request                       Request to dispatch.
	 * @param string          $expected_code                 Expected error code.
	 * @param string          $rejected_before_callback_from WordPress version from which the schema rejects the request before the route callback runs.
	 */
	protected function assert_rest_request_rejected( WP_REST_Request $request, $expected_code, $rejected_before_callback_from ) {
		// WordPress applies `rest_dispatch_request` right before it calls the route callback.
		$dispatch_filter = new MockAction();
		add_filter( 'rest_dispatch_request', array( $dispatch_filter, 'filter' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'The request should get a bad request status.' );
		$this->assertEquals( $expected_code, $response->get_data()['code'], 'The request should report the invalid parameter.' );

		if ( version_compare( get_bloginfo( 'version' ), $rejected_before_callback_from, '>=' ) ) {
			$this->assertSame( 0, $dispatch_filter->get_call_count(), 'The request should be rejected before the route callback runs.' );
		}
	}

	/**
	 * Calls the callback of a route's endpoint directly, without WordPress's checks of the request.
	 *
	 * WordPress before 5.5 lets data with a missing or empty property through to the callback, and before 5.6 an empty object.
	 * So a test reaches the callback's own check of such data this way on every version.
	 *
	 * @param string $method HTTP method of the endpoint.
	 * @param string $route  Route path under the Site Kit REST root.
	 * @param mixed  $data   Value of the request's `data` parameter.
	 * @return mixed What the callback returns.
	 */
	protected function call_route_callback( $method, $route, $data ) {
		$path     = '/' . REST_Routes::REST_ROOT . '/' . $route;
		$handlers = array_filter(
			rest_get_server()->get_routes()[ $path ],
			fn ( $handler ) => ! empty( $handler['methods'][ $method ] )
		);
		$request  = new WP_REST_Request( $method, $path );
		$request->set_param( 'data', $data );

		return call_user_func( reset( $handlers )['callback'], $request );
	}
}
