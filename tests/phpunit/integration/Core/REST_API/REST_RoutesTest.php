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
use Google\Site_Kit\Core\REST_API\Schema\Dismissed_Prompts_Schema;
use Google\Site_Kit\Core\REST_API\Schema\Dismissed_Slugs_Schema;
use Google\Site_Kit\Core\REST_API\Schema\Expirable_Items_Schema;
use Google\Site_Kit\Core\REST_API\Schema\On_Off_Setting_Schema;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

/**
 * @group REST_API
 */
class REST_RoutesTest extends TestCase {

	public function tear_down() {
		parent::tear_down();
		// Each test that uses the REST server then starts with a new one.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_rest_root() {
		// Assert that REST root is correct (this must not change).
		$this->assertEquals( 'google-site-kit/v1', REST_Routes::REST_ROOT, 'REST root should be google-site-kit/v1.' );
	}

	public function test_register() {
		$this->register_site_kit_routes();
		// Re-init a new REST Server (triggers rest_api_init).
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

	public function test_routes_expose_resource_schemas() {
		$this->register_site_kit_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT );
		$request->set_param( 'context', 'help' );
		$routes = rest_get_server()->dispatch( $request )->get_data()['routes'];
		unset( $routes[ '/' . REST_Routes::REST_ROOT ] );

		// The routes that have no resource schema yet. Take a route off this list once it has one.
		// The tests turn every feature flag off, so a route behind a flag never registers here.
		$routes_without_schema = array_map(
			fn ( $route ) => '/' . REST_Routes::REST_ROOT . '/' . $route,
			array(
				'core/intents/data/complete-intent',
				'core/intents/data/intent',
				'core/modules/data/check-access',
				'core/modules/data/sharing-settings',
				'core/search/data/entity-search',
				'core/site/data/admin-bar-settings',
				'core/site/data/ads-measurement-status',
				'core/site/data/connection',
				'core/site/data/consent-api-activate',
				'core/site/data/consent-api-info',
				'core/site/data/consent-mode',
				'core/site/data/conversion-tracking',
				'core/site/data/developer-plugin',
				'core/site/data/email-reporting',
				'core/site/data/email-reporting-eligible-subscribers',
				'core/site/data/email-reporting-errors',
				'core/site/data/email-reporting-invite-user',
				'core/site/data/email-reporting-subscribed-users',
				'core/site/data/email-reporting-unsubscribe-user',
				'core/site/data/health-checks',
				'core/site/data/mark-notification',
				'core/site/data/notifications',
				'core/site/data/reset',
				'core/site/data/reset-persistent',
				'core/site/data/setup-tag',
				'core/site/data/site-health-tag-placement-test',
				'core/user/data/authentication',
				'core/user/data/disconnect',
				'core/user/data/feedback',
				'core/user/data/get-token',
				'core/user/data/nonces',
				'core/user/data/permissions',
				'core/user/data/survey',
				'core/user/data/survey-event',
				'core/user/data/survey-timeouts',
				'core/user/data/survey-trigger',
				'modules/(?P<slug>[a-z0-9\\-]+)/data/(?P<datapoint>[a-z\\-]+)',
				'modules/(?P<slug>[a-z0-9\\-]+)/data/data-available',
				'modules/(?P<slug>[a-z0-9\\-]+)/data/notifications',
				'modules/(?P<slug>[a-z0-9\\-]+)/data/settings',
			)
		);

		$this->assertEqualSets(
			$routes_without_schema,
			array_keys( array_filter( $routes, fn ( $route ) => empty( $route['schema'] ) ) ),
			'Every route outside the list should have a resource schema, and no route on the list should have one.'
		);
	}

	/**
	 * @dataProvider provider_route_resource_schemas
	 *
	 * @param string $route        Route path under the Site Kit REST root.
	 * @param string $schema_class Class whose `get()` returns the route's resource schema.
	 */
	public function test_rest_index_lists_route_resource_schema( $route, $schema_class ) {
		$this->register_site_kit_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT );
		$request->set_param( 'context', 'help' );
		$routes = rest_get_server()->dispatch( $request )->get_data()['routes'];
		$schema = $schema_class::get();

		$this->assertArrayHasKey( 'title', $schema, "The resource schema of $route should have a title." );
		$this->assertEquals(
			$schema,
			$routes[ '/' . REST_Routes::REST_ROOT . '/' . $route ]['schema'],
			"The REST index should list the resource schema of $route."
		);
	}

	public function provider_route_resource_schemas() {
		return array(
			'dismissed-items'           => array( 'core/user/data/dismissed-items', Dismissed_Slugs_Schema::class ),
			'dismiss-item'              => array( 'core/user/data/dismiss-item', Dismissed_Slugs_Schema::class ),
			'dismissed-prompts'         => array( 'core/user/data/dismissed-prompts', Dismissed_Prompts_Schema::class ),
			'dismiss-prompt'            => array( 'core/user/data/dismiss-prompt', Dismissed_Prompts_Schema::class ),
			'dismissed-tours'           => array( 'core/user/data/dismissed-tours', Dismissed_Slugs_Schema::class ),
			'dismiss-tour'              => array( 'core/user/data/dismiss-tour', Dismissed_Slugs_Schema::class ),
			'expirable-items'           => array( 'core/user/data/expirable-items', Expirable_Items_Schema::class ),
			'set-expirable-item-timers' => array( 'core/user/data/set-expirable-item-timers', Expirable_Items_Schema::class ),
			'tracking'                  => array( 'core/user/data/tracking', On_Off_Setting_Schema::class ),
		);
	}

	/**
	 * @dataProvider provider_routes_with_data
	 *
	 * @param string $route  Route path under the Site Kit REST root.
	 * @param string $method HTTP method of the endpoint that takes `data`.
	 */
	public function test_rest_index_lists_route_data_argument( $route, $method ) {
		$this->register_site_kit_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT );
		$request->set_param( 'context', 'help' );
		$routes    = rest_get_server()->dispatch( $request )->get_data()['routes'];
		$endpoints = array_filter(
			$routes[ '/' . REST_Routes::REST_ROOT . '/' . $route ]['endpoints'],
			// An endpoint of `WP_REST_Server::EDITABLE` lists POST, PUT and PATCH.
			fn ( $endpoint ) => in_array( $method, $endpoint['methods'], true )
		);
		$data      = reset( $endpoints )['args']['data'];

		$this->assertTrue( $data['required'], "The REST index should list the data argument of $route as required." );
		$this->assertNotEmpty( $data['type'], "The REST index should list the type of the data argument of $route." );
		$this->assertNotEmpty( $data['description'], "The REST index should list the description of the data argument of $route." );

		if ( 'array' === $data['type'] ) {
			$this->assertNotEmpty( $data['items'], "The REST index should list the items of the data argument of $route." );
		} elseif ( version_compare( get_bloginfo( 'version' ), '5.6', '>=' ) ) {
			// WordPress lists the properties of an object argument in the index only from 5.6.
			$this->assertNotEmpty( $data['properties'], "The REST index should list the properties of the data argument of $route." );
		}

		$this->assertSame(
			array(),
			$this->get_properties_without_description( $data, 'data' ),
			"The REST index should list a description for each property of the data argument of $route."
		);
	}

	public function provider_routes_with_data() {
		return array(
			'POST audience-settings'             => array( 'core/user/data/audience-settings', 'POST' ),
			'POST conversion-reporting-settings' => array( 'core/user/data/conversion-reporting-settings', 'POST' ),
			'POST email-reporting-settings'      => array( 'core/user/data/email-reporting-settings', 'POST' ),
			'POST initial-setup-settings'        => array( 'core/user/data/initial-setup-settings', 'POST' ),
			'DELETE dismissed-items'             => array( 'core/user/data/dismissed-items', 'DELETE' ),
			'POST dismiss-item'                  => array( 'core/user/data/dismiss-item', 'POST' ),
			'POST dismiss-prompt'                => array( 'core/user/data/dismiss-prompt', 'POST' ),
			'POST dismiss-tour'                  => array( 'core/user/data/dismiss-tour', 'POST' ),
			'POST key-metrics'                   => array( 'core/user/data/key-metrics', 'POST' ),
			'POST set-expirable-item-timers'     => array( 'core/user/data/set-expirable-item-timers', 'POST' ),
			'POST tracking'                      => array( 'core/user/data/tracking', 'POST' ),
			'POST user-input-settings'           => array( 'core/user/data/user-input-settings', 'POST' ),
		);
	}

	/**
	 * Lists each property inside a schema, at any depth, that has no description.
	 *
	 * @param array  $schema Schema whose properties to check.
	 * @param string $path   Where the schema sits, for the message.
	 * @return array List of the paths of the properties with no description.
	 */
	private function get_properties_without_description( array $schema, $path ) {
		$missing = array();
		if ( isset( $schema['items'] ) && is_array( $schema['items'] ) ) {
			$missing = $this->get_properties_without_description( $schema['items'], "$path items" );
		}

		foreach ( isset( $schema['properties'] ) ? $schema['properties'] : array() as $property => $property_schema ) {
			if ( empty( $property_schema['description'] ) ) {
				$missing[] = "$path.$property";
			}
			$missing = array_merge( $missing, $this->get_properties_without_description( $property_schema, "$path.$property" ) );
		}

		return $missing;
	}

	public function test_route_argument_schemas_are_valid() {
		$this->register_site_kit_routes();

		$problems = array();
		foreach ( rest_get_server()->get_routes() as $route => $endpoints ) {
			if ( 0 !== strpos( $route, '/' . REST_Routes::REST_ROOT . '/' ) ) {
				continue;
			}

			foreach ( $endpoints as $endpoint ) {
				foreach ( $endpoint['args'] as $name => $arg ) {
					$problems = array_merge( $problems, $this->get_schema_problems( $arg, "$route $name" ) );
				}
			}
		}

		$this->assertSame( array(), $problems, 'Every argument schema should give each value a type WordPress knows, and each array its items.' );
	}

	/**
	 * Lists where an argument schema breaks the rules WordPress has for its types.
	 *
	 * WordPress from 5.5 calls a schema wrong where it has no type or one outside its seven.
	 * WordPress 5.2 reads `type` and the `items` of an array with no check.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $schema Argument schema.
	 * @param string $path   Where the schema sits, for the message.
	 * @return array List of messages, one for each problem.
	 */
	private function get_schema_problems( array $schema, $path ) {
		$types = isset( $schema['type'] ) ? (array) $schema['type'] : array();
		if ( empty( $types ) || array_diff( $types, array( 'array', 'object', 'string', 'number', 'integer', 'boolean', 'null' ) ) ) {
			return array( "$path has no type WordPress knows." );
		}

		$problems = array();
		if ( in_array( 'array', $types, true ) ) {
			if ( ! isset( $schema['items'] ) ) {
				$problems[] = "$path is an array with no items.";
			} else {
				$problems = array_merge( $problems, $this->get_schema_problems( $schema['items'], "$path items" ) );
			}
		}

		if ( isset( $schema['properties'] ) ) {
			foreach ( $schema['properties'] as $property => $property_schema ) {
				$problems = array_merge( $problems, $this->get_schema_problems( $property_schema, "$path.$property" ) );
			}
		}

		if ( isset( $schema['additionalProperties'] ) && is_array( $schema['additionalProperties'] ) ) {
			$problems = array_merge( $problems, $this->get_schema_problems( $schema['additionalProperties'], "$path additional properties" ) );
		}

		return $problems;
	}

	/**
	 * Registers the Site Kit REST routes on a new REST server, with no other routes.
	 *
	 * @since n.e.x.t
	 */
	private function register_site_kit_routes() {
		$rest_routes = new REST_Routes( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		// Clear out initial REST server, and remove all existing actions on rest_api_init.
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_actions( 'rest_api_init' );

		$rest_routes->register();
	}
}
