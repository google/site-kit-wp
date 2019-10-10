<?php
/**
 * REST_RouteTest
 *
 * @package   Google\Site_Kit\Tests\Core\REST_API
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\REST_API;

use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Tests\TestCase;
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

		$this->assertEquals( $expected_uri, $route->get_uri() );
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
		$this->assertEquals( array(), $route->get_args() );

		// Test default args
		$route = new REST_Route(
			'test-uri',
			array(
				'args' => array(),
			)
		);
		$this->assertCount( 1, $route->get_args() );
		$single_route_args = $route->get_args()[0];
		$this->assertEquals( WP_REST_Server::READABLE, $single_route_args['methods'] );
		$this->assertNull( $single_route_args['callback'] );
		$this->assertEquals( array(), $single_route_args['args'] );

		// Test arg defaults
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
				'validate_callback' => 'rest_validate_request_arg',
				'sanitize_callback' => 'rest_sanitize_request_arg',
				'required'          => false,
				'default'           => null,
			),
			$route->get_args()[0]['args']['args']
		);

		// Test args take precedence over defaults
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
			$route->get_args()[0]['args']['args']
		);
	}
}
