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

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use MockAction;
use stdClass;
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
	 * Dispatches a REST request, and asserts that it fails with a 400 and the given error code before the route's callback runs.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_REST_Request $request       Request to dispatch.
	 * @param string          $expected_code Expected error code.
	 */
	protected function assertRESTRequestRejected( WP_REST_Request $request, $expected_code ) {
		// WordPress applies `rest_dispatch_request` right before it calls the route callback.
		$dispatch_filter = new MockAction();
		add_filter( 'rest_dispatch_request', array( $dispatch_filter, 'filter' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'The request should get a bad request status.' );
		$this->assertEquals( $expected_code, $response->get_data()['code'], 'The request should fail with the expected error code.' );
		$this->assertSame( 0, $dispatch_filter->get_call_count(), 'The request should be rejected before the route callback runs.' );
	}

	/**
	 * Grants every user `Permissions::VIEW_DASHBOARD`, which otherwise needs a Google sign-in or a role a module is shared with.
	 *
	 * @since n.e.x.t
	 */
	protected function grant_dashboard_permission() {
		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ) {
				return Permissions::VIEW_DASHBOARD === $cap ? array() : $caps;
			},
			20,
			2
		);
	}

	/**
	 * Gets a route's resource schema, as the REST index lists it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $route Route path under the Site Kit REST root.
	 * @return array Resource schema of the route.
	 */
	protected function get_route_resource_schema( $route ) {
		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT );
		$request->set_param( 'context', 'help' );

		return rest_get_server()->dispatch( $request )->get_data()['routes'][ '/' . REST_Routes::REST_ROOT . '/' . $route ]['schema'];
	}

	/**
	 * Asserts that response data matches the resource schema the REST index lists for its route.
	 *
	 * `rest_validate_value_from_schema()` accepts a key that the schema leaves out. It also reads the
	 * data as a request, so it takes `'1'` as a `boolean` and any PHP array as an `object`. So this
	 * also asserts that the schema describes each key of the data, at any depth. A schema can also
	 * open an object to any key, with `additionalProperties` set to `true`. And it asserts that each
	 * value has a type its schema names once the data is JSON, as a client gets it.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed  $data    Response data.
	 * @param string $route   Route path under the Site Kit REST root.
	 * @param string $message Message for a failure.
	 */
	protected function assertMatchesRouteResourceSchema( $data, $route, $message ) {
		$schema = $this->get_route_resource_schema( $route );

		$this->assertTrue( rest_validate_value_from_schema( $data, $schema ), $message );
		$this->assertSame( array(), $this->get_keys_outside_schema( $data, $schema, 'data' ), $message );
		$this->assertSame( array(), $this->get_values_of_another_json_type( json_decode( wp_json_encode( $data ) ), $schema, 'data' ), $message );
	}

	/**
	 * Lists each key of a value, at any depth, that its schema does not describe.
	 *
	 * A schema with `additionalProperties` set to `true` allows any key with any value, so each
	 * such key counts as described.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed  $value  Value to check.
	 * @param array  $schema Schema of the value.
	 * @param string $path   Where the value sits, for the message.
	 * @return array List of the paths of the keys the schema does not describe.
	 */
	private function get_keys_outside_schema( $value, array $schema, $path ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$keys = array();
		foreach ( $value as $key => $item ) {
			if ( wp_is_numeric_array( $value ) && isset( $schema['items'] ) ) {
				$item_schema = $schema['items'];
			} elseif ( isset( $schema['properties'][ $key ] ) ) {
				$item_schema = $schema['properties'][ $key ];
			} elseif ( isset( $schema['additionalProperties'] ) && is_array( $schema['additionalProperties'] ) ) {
				$item_schema = $schema['additionalProperties'];
			} elseif ( isset( $schema['additionalProperties'] ) && true === $schema['additionalProperties'] ) {
				continue;
			} else {
				$keys[] = "$path.$key";
				continue;
			}

			$keys = array_merge( $keys, $this->get_keys_outside_schema( $item, $item_schema, "$path.$key" ) );
		}

		return $keys;
	}

	/**
	 * Lists each value, at any depth, whose JSON type is not one its schema names.
	 *
	 * An empty list matches `object` too, because PHP has one empty array for both, and
	 * `wp_json_encode()` writes it as `[]`.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed  $value  Value read from JSON, with each object as a `stdClass`.
	 * @param array  $schema Schema of the value.
	 * @param string $path   Where the value sits, for the message.
	 * @return array List of the paths of the values of another type.
	 */
	private function get_values_of_another_json_type( $value, array $schema, $path ) {
		if ( ! isset( $schema['type'] ) ) {
			return array();
		}

		if ( $value instanceof stdClass ) {
			$value_types = array( 'object' );
		} elseif ( is_array( $value ) ) {
			$value_types = array() === $value ? array( 'array', 'object' ) : array( 'array' );
		} elseif ( is_int( $value ) ) {
			$value_types = array( 'integer', 'number' );
		} elseif ( is_float( $value ) ) {
			$value_types = array( 'number' );
		} elseif ( is_bool( $value ) ) {
			$value_types = array( 'boolean' );
		} elseif ( is_string( $value ) ) {
			$value_types = array( 'string' );
		} else {
			$value_types = array( 'null' );
		}

		if ( ! array_intersect( $value_types, (array) $schema['type'] ) ) {
			return array( $path );
		}

		$paths = array();
		if ( $value instanceof stdClass ) {
			foreach ( get_object_vars( $value ) as $key => $item ) {
				if ( isset( $schema['properties'][ $key ] ) ) {
					$paths = array_merge( $paths, $this->get_values_of_another_json_type( $item, $schema['properties'][ $key ], "$path.$key" ) );
				} elseif ( isset( $schema['additionalProperties'] ) && is_array( $schema['additionalProperties'] ) ) {
					$paths = array_merge( $paths, $this->get_values_of_another_json_type( $item, $schema['additionalProperties'], "$path.$key" ) );
				}
			}
		} elseif ( is_array( $value ) && isset( $schema['items'] ) ) {
			foreach ( $value as $index => $item ) {
				$paths = array_merge( $paths, $this->get_values_of_another_json_type( $item, $schema['items'], "$path.$index" ) );
			}
		}

		return $paths;
	}
}
