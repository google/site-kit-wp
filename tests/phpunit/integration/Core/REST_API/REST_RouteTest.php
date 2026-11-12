<?php
/**
 * REST_RouteTest
 *
 * @package   Google\Site_Kit\Tests\Core\REST_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\REST_API;

use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @group REST_API
 */
class REST_RouteTest extends TestCase {

	/**
	 * @dataProvider uri_provider
	 */
	public function test_get_uri( $uri, $expected_uri ) {
		$route = new REST_Route( $uri, array() );

		$this->assertEquals( $expected_uri, $route->get_uri(), 'REST route should normalize URI as expected.' );
	}

	public function uri_provider() {
		return array(
			array( 'test-uri', 'test-uri' ),
			array( '/test-uri', 'test-uri' ),
			array( 'test-uri/', 'test-uri' ),
			array( '/test-uri/', 'test-uri' ),
			array( '//test-uri/', 'test-uri' ),
			array( '//test-uri//', 'test-uri' ),
			array( '///test-uri///', 'test-uri' ),
			array( '/test/uri/', 'test/uri' ),
		);
	}

	public function test_get_args() {
		$route = new REST_Route( 'test-uri', array() );
		$this->assertEquals( array(), $route->get_args(), 'Default route args should be empty when not provided.' );

		// Test default args.
		$route = new REST_Route(
			'test-uri',
			array(
				'args' => array(),
			)
		);
		$this->assertCount( 1, $route->get_args(), 'Route should have one default arg set.' );
		$single_route_args = $route->get_args()[0];
		$this->assertEquals( WP_REST_Server::READABLE, $single_route_args['methods'], 'Default method should be READABLE.' );
		$this->assertNull( $single_route_args['callback'], 'Default callback should be null.' );
		$this->assertEquals( array(), $single_route_args['args'], 'Default args should be empty.' );

		// Test arg defaults.
		$route = new REST_Route(
			'test-uri',
			array(
				'args' => array(
					'args' => array(),
				),
			)
		);
		$this->assertEqualSetsWithIndex(
			array(
				'type'              => 'string',
				'description'       => '',
				'validate_callback' => array( REST_Route::class, 'validate_request_arg' ),
				'sanitize_callback' => 'rest_sanitize_request_arg',
				'required'          => false,
				'default'           => null,
			),
			$route->get_args()[0]['args']['args'],
			'Route argument definitions should include all default schema values.'
		);

		// Test args take precedence over defaults.
		$route = new REST_Route(
			'test-uri',
			array(
				'args' => array(
					'args' => array(
						'type'              => 'boolean',
						'description'       => 'test description',
						'validate_callback' => 'test_validate_callback',
						'default'           => true,
					),
				),
			)
		);
		$this->assertEqualSetsWithIndex(
			array(
				'type'              => 'boolean',
				'required'          => false,
				'description'       => 'test description',
				'validate_callback' => 'test_validate_callback',
				'sanitize_callback' => 'rest_sanitize_request_arg',
				'default'           => true,
			),
			$route->get_args()[0]['args']['args'],
			'Explicit route argument values should override schema defaults.'
		);
	}

	public function test_validate_request_arg__returns_the_error_of_wordpress() {
		$request = new WP_REST_Request( 'POST', '/google-site-kit/v1/test' );
		$request->set_attributes( array( 'args' => array( 'data' => $this->get_slug_schema() ) ) );
		$data = array( 'slug' => 123 );

		$this->assertEquals(
			rest_validate_request_arg( $data, $request, 'data' ),
			REST_Route::validate_request_arg( $data, $request, 'data' ),
			'The check should return the error of WordPress where WordPress rejects the value.'
		);
	}

	public function test_validate_request_arg__accepts_valid_data() {
		$request = new WP_REST_Request( 'POST', '/google-site-kit/v1/test' );
		$request->set_attributes( array( 'args' => array( 'data' => $this->get_slug_schema() ) ) );

		$this->assertTrue(
			REST_Route::validate_request_arg( array( 'slug' => 'foo' ), $request, 'data' ),
			'The check should accept a value that meets its schema.'
		);
	}

	/**
	 * @dataProvider provider_values_the_keywords_older_versions_skip_reject
	 */
	public function test_is_valid_by_keywords_older_versions_skip__rejects( $value, $schema ) {
		$method = $this->get_accessible_method( REST_Route::class, 'is_valid_by_keywords_older_versions_skip' );

		$this->assertFalse( $method->invoke( null, $value, $schema ), 'The check should reject a value that breaks a keyword WordPress checks only from 5.5 or 5.6.' );
	}

	public function provider_values_the_keywords_older_versions_skip_reject() {
		$slug_schema = $this->get_slug_schema();
		$list_schema = array(
			'type'     => 'array',
			'minItems' => 1,
			'maxItems' => 2,
			'items'    => array(
				'type' => 'string',
			),
		);

		return array(
			'a required property is missing'             => array( array(), $slug_schema ),
			'a string is shorter than its minLength'     => array( array( 'slug' => '' ), $slug_schema ),
			'an array has fewer items than its minItems' => array( array(), $list_schema ),
			'an array has more items than its maxItems'  => array( array( 'a', 'b', 'c' ), $list_schema ),
			'a list sent as a string has more items than maxItems' => array( 'a,b,c', $list_schema ),
			'an object has fewer properties than minProperties' => array(
				array(),
				array(
					'type'          => 'object',
					'minProperties' => 1,
				),
			),
			'an empty string for an object has no properties' => array(
				'',
				array(
					'type'          => 'object',
					'minProperties' => 1,
				),
			),
			'a property of an object breaks a keyword'   => array(
				array( 'slugs' => array() ),
				array(
					'type'       => 'object',
					'properties' => array(
						'slugs' => $list_schema,
					),
				),
			),
			'an item of an array breaks a keyword'       => array(
				array( array( 'slug' => 'foo' ), array() ),
				array(
					'type'  => 'array',
					'items' => $slug_schema,
				),
			),
			'a stdClass with no slug'                    => array( (object) array(), $slug_schema ),
		);
	}

	/**
	 * @dataProvider provider_values_the_keywords_older_versions_skip_accept
	 */
	public function test_is_valid_by_keywords_older_versions_skip__accepts( $value, $schema ) {
		$method = $this->get_accessible_method( REST_Route::class, 'is_valid_by_keywords_older_versions_skip' );

		$this->assertTrue( $method->invoke( null, $value, $schema ), 'The check should accept a value that meets each keyword WordPress checks only from 5.5 or 5.6.' );
	}

	public function provider_values_the_keywords_older_versions_skip_accept() {
		$slug_schema = $this->get_slug_schema();

		return array(
			'each keyword is met'                    => array(
				array( array( 'slug' => 'foo' ), array( 'slug' => 'bar' ) ),
				array(
					'type'     => 'array',
					'minItems' => 1,
					'maxItems' => 2,
					'items'    => $slug_schema,
				),
			),
			'an optional property is missing'        => array( array( 'slug' => 'foo' ), $slug_schema ),
			'a slug of 0 is one character long'      => array( array( 'slug' => '0' ), $slug_schema ),
			'a list sent as a string meets maxItems' => array(
				'a,b',
				array(
					'type'     => 'array',
					'maxItems' => 2,
					'items'    => array(
						'type' => 'string',
					),
				),
			),
			'a list has as many items as minItems'   => array(
				array( 'foo' ),
				array(
					'type'     => 'array',
					'minItems' => 1,
					'items'    => array(
						'type' => 'string',
					),
				),
			),
			'an object has as many properties as minProperties' => array(
				array( 'enabled' => true ),
				array(
					'type'          => 'object',
					'minProperties' => 1,
				),
			),
			'a stdClass with a slug'                 => array( (object) array( 'slug' => 'foo' ), $slug_schema ),
		);
	}

	/**
	 * Gets the schema of an object with a required, non-empty `slug` and an optional `expiration`.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema of the object.
	 */
	private function get_slug_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'slug'       => array(
					'type'      => 'string',
					'required'  => true,
					'minLength' => 1,
				),
				'expiration' => array(
					'type' => 'integer',
				),
			),
		);
	}
}
