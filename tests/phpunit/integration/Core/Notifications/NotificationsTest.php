<?php
/**
 * Class Google\Site_Kit\Tests\Core\Notifications\NotificationsTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Notifications
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Notifications;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Notifications\Notifications;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\MutableInput;
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
		$notifications                  = new Notifications( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$context                        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy                   = new Google_Proxy( $context );
		$google_proxy_notifications_url = $google_proxy->url( '/notifications/' );

		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_filters( 'googlesitekit_rest_routes' );

		$notifications->register();

		// Create a user with access to the WP REST API and log in.
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->fake_site_connection();

		add_filter(
			'pre_http_request',
			function ( $override, $args, $url ) use ( $google_proxy_notifications_url ) {
				if ( strstr( $url, $google_proxy_notifications_url ) ) {
					$this->fail( 'Expected no request to be made to Google proxy notifications endpoint' );
				}
				return $override;
			},
			10,
			3
		);

		// Make the test request.
		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/notifications' );
		$response = rest_get_server()->dispatch( $request );

		// Confirm the request returns 200 status code.
		$this->assertEquals( 200, $response->get_status() );
	}
}
