<?php
/**
 * REST_RoutesTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\REST_API;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group REST_API
 */
class REST_RoutesTest extends TestCase {

	public function test_rest_root() {
		// Assert that REST root is correct (this must not change).
		$this->assertEquals( 'google-site-kit/v1', REST_Routes::REST_ROOT, 'REST root should be google-site-kit/v1.' );
	}

	public function test_register() {
		$rest_routes = new REST_Routes( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		// Clear out initial REST server, and remove all existing actions on rest_api_init
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_actions( 'rest_api_init' );

		$rest_routes->register();
		// Re-init a new REST Server (triggers rest_api_init)
		$server = rest_get_server();

		// Assert that routes with the site-kit namespace were registered.
		$this->assertEquals( array( REST_Routes::REST_ROOT ), $server->get_namespaces(), 'Only Site Kit REST namespace should be registered.' );

		// While most of these routes are added via filter, they should all be in this list.
		$routes = array(
			'/' . REST_Routes::REST_ROOT,
			'/' . REST_Routes::REST_ROOT . '/core/site/data/reset',
			'/' . REST_Routes::REST_ROOT . '/core/user/data/disconnect',
			'/' . REST_Routes::REST_ROOT . '/core/user/data/authentication',
			'/' . REST_Routes::REST_ROOT . '/core/modules/data/list',
			'/' . REST_Routes::REST_ROOT . '/core/modules/data/info',
			'/' . REST_Routes::REST_ROOT . '/core/modules/data/activation',
			'/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access',
			'/' . REST_Routes::REST_ROOT . '/modules/(?P<slug>[a-z0-9\\-]+)/data/(?P<datapoint>[a-z\\-]+)',
			'/' . REST_Routes::REST_ROOT . '/modules/(?P<slug>[a-z0-9\\-]+)/data/notifications',
			'/' . REST_Routes::REST_ROOT . '/modules/(?P<slug>[a-z0-9\\-]+)/data/settings',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/developer-plugin',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/health-checks',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/setup-tag',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/connection',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/notifications',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/mark-notification',
		);

		// Filter out other endpoints (not registered in the plugin).
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Registered routes should match expected list.' );
	}
}
