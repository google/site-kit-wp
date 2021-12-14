<?php

/**
 * REST_Tracking_Consent_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tracking
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Tracking\REST_Tracking_Consent_Controller;
use Google\Site_Kit\Core\Tracking\Tracking_Consent;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * @group tracking
 */
class REST_Tracking_Consent_ControllerTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_register() {
		$tracking_consent_mock = $this->getTrackingConsentMock( array( 'register', 'get' ) );
		$tracking_consent_mock->expects( $this->once() )->method( 'register' );
		$REST_Controller = new REST_Tracking_Consent_Controller( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $REST_Controller, 'consent', $tracking_consent_mock );

		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );
		remove_all_filters( 'googlesitekit_rest_routes' );

		$REST_Controller->register();

		$rest_routes = apply_filters( 'googlesitekit_rest_routes', array() );

		$routes = array_map(
			function ( REST_Route $route ) {
				return $route->get_uri();
			},
			$rest_routes
		);
		$this->assertEqualSets(
			array(
				'core/user/data/tracking',
			),
			$routes
		);
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
	}

	public function test_unauthorized_get_request() {
		$REST_Controller = new REST_Tracking_Consent_Controller( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$REST_Controller->register();

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	public function test_read_tracking_status_from_rest_api() {
		$REST_Controller = new REST_Tracking_Consent_Controller( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$REST_Controller->register();

		// Create a user with access to the WP REST API and log in.
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->fake_site_connection();

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'enabled', $response->get_data() );
		$this->assertFalse( $response->get_data()['enabled'] );
	}

	public function test_unauthorized_post_request() {
		$REST_Controller = new REST_Tracking_Consent_Controller( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$REST_Controller->register();

		$request = new WP_REST_Request(
			WP_REST_Server::CREATABLE,
			'/' . REST_Routes::REST_ROOT . '/core/user/data/tracking'
		);

		$request->set_header( 'content-type', 'application/json' );
		$body = json_encode(
			array(
				'data' => array(
					'enabled' => true,
				),
			)
		);
		$request->set_body( $body );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	public function test_modify_status_of_tracking() {
		$REST_Controller = new REST_Tracking_Consent_Controller( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$REST_Controller->register();

		// Create a user with access to the WP REST API and log in.
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->fake_site_connection();

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'enabled', $response->get_data() );
		$this->assertFalse( $response->get_data()['enabled'] );

		$request = new WP_REST_Request(
			WP_REST_Server::CREATABLE,
			'/' . REST_Routes::REST_ROOT . '/core/user/data/tracking'
		);

		$request->set_header( 'content-type', 'application/json' );
		$body = json_encode(
			array(
				'data' => array(
					'enabled' => true,
				),
			)
		);
		$request->set_body( $body );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'enabled', $response->get_data() );
		$this->assertTrue( $response->get_data()['enabled'] );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'enabled', $response->get_data() );
		$this->assertTrue( $response->get_data()['enabled'] );
	}

	protected function getTrackingConsentMock( $methods ) {
		return $this->getMockBuilder( Tracking_Consent::class )
			->disableOriginalConstructor()
			->setMethods( (array) $methods )
			->getMock();
	}
}
