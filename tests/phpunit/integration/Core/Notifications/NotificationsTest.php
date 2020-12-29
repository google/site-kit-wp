<?php
/**
 * Class Google\Site_Kit\Tests\Core\Notifications\NotificationsTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Notifications
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Notifications;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Notifications\Notifications;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

/**
 * @group Notifications
 */
class NotificationsTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_register() {
		$notifications = new Notifications( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_rest_routes' );

		$notifications->register();

		$rest_routes = apply_filters( 'googlesitekit_rest_routes', array() );

		$routes = array_map(
			function ( REST_Route $route ) {
				return $route->get_uri();
			},
			$rest_routes
		);
		$this->assertEqualSets(
			array(
				'core/site/data/notifications',
				'core/site/data/mark-notification',
			),
			$routes
		);
	}

	public function test_non_proxy_request_does_not_request_proxy() {
		// Create a user with access to the WP REST API and log in.
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		// Fake setup and authentication for access to dashboard.
		$this->fake_site_connection();
		remove_all_filters( 'googlesitekit_setup_complete' );
		$authentication = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_access_token( 'test-access-token', HOUR_IN_SECONDS );

		// Set up the REST Routes including the notification route to test.
		$rest_routes = new REST_Routes( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$rest_routes->register();

		// Get a REST server instance.
		$server = rest_get_server();

		// Make the test request.
		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/notifications' );
		$response = $server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals(
			array(),
			$data
		);
	}
}
