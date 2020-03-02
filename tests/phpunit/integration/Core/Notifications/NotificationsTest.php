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
use Google\Site_Kit\Core\Notifications\Notifications;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Notifications
 */
class NotificationsTest extends TestCase {

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
}
