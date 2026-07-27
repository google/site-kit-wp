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
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tracking\REST_Tracking_Consent_Controller;
use Google\Site_Kit\Core\Tracking\Tracking_Consent;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @group tracking
 */
class REST_Tracking_Consent_ControllerTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
		unset( $GLOBALS['current_user'] );
	}

	public function test_register() {
		$controller = $this->get_rest_controller_instance();

		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );
		remove_all_filters( 'googlesitekit_rest_routes' );

		$controller->register();

		$this->assertTrue(
			has_filter( 'googlesitekit_apifetch_preload_paths' ),
			'Tracking consent endpoint should be added to API fetch preload paths.'
		);
		$this->assertTrue(
			has_filter( 'googlesitekit_rest_routes' ),
			'Tracking consent REST routes should be registered.'
		);
	}

	public function test_unauthorized_get_request() {
		$controller = $this->get_rest_controller_instance();
		$controller->register();

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotEquals( 200, $response->get_status(), 'Unauthenticated tracking consent read should not succeed.' );
		$this->assertArrayHasKey( 'code', $response->get_data(), 'Rejected tracking consent read should include an error code.' );
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'], 'Unauthenticated users should not be able to read tracking consent.' );
	}

	public function test_read_tracking_status_from_rest_api() {
		$controller = $this->get_rest_controller_instance();
		$controller->register();

		// Create a user with access to the WP REST API and log in.
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'Authenticated user should be able to read tracking consent.' );
		$this->assertArrayHasKey( 'enabled', $response->get_data(), 'Tracking consent response should include enabled state.' );
		$this->assertFalse( $response->get_data()['enabled'], 'Tracking consent should be disabled by default.' );
	}

	public function test_unauthorized_post_request() {
		$controller = $this->get_rest_controller_instance();
		$controller->register();

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

		$this->assertNotEquals( 200, $response->get_status(), 'Unauthenticated tracking consent update should not succeed.' );
		$this->assertArrayHasKey( 'code', $response->get_data(), 'Rejected tracking consent update should include an error code.' );
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'], 'Unauthenticated users should not be able to update tracking consent.' );
	}

	public function test_modify_status_of_tracking() {
		$controller = $this->get_rest_controller_instance();
		$controller->register();

		// Create a user with access to the WP REST API and log in.
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'Authenticated user should be able to read tracking consent before updating it.' );
		$this->assertArrayHasKey( 'enabled', $response->get_data(), 'Initial tracking consent response should include enabled state.' );
		$this->assertFalse( $response->get_data()['enabled'], 'Tracking consent should initially be disabled.' );

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

		$this->assertEquals( 200, $response->get_status(), 'Authenticated user should be able to enable tracking consent.' );
		$this->assertArrayHasKey( 'enabled', $response->get_data(), 'Tracking consent update response should include enabled state.' );
		$this->assertTrue( $response->get_data()['enabled'], 'Tracking consent update should return the enabled state.' );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/tracking' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'Authenticated user should be able to read updated tracking consent.' );
		$this->assertArrayHasKey( 'enabled', $response->get_data(), 'Updated tracking consent response should include enabled state.' );
		$this->assertTrue( $response->get_data()['enabled'], 'Enabled tracking consent should persist across subsequent reads.' );
	}

	protected function get_rest_controller_instance() {
		$tracking_consent = new Tracking_Consent( new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		return new REST_Tracking_Consent_Controller( $tracking_consent );
	}
}
