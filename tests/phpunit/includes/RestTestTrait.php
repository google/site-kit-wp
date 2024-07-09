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

trait RestTestTrait {

	protected function register_rest_routes() {
		$routes = apply_filters( 'googlesitekit_rest_routes', array() );
		$this->assertNotEmpty( $routes );

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
}
