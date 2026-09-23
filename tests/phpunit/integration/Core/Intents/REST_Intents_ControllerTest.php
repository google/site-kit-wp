<?php
/**
 * Google\Site_Kit\Core\Intents\REST_Intents_Controller tests.
 *
 * @package   Google\Site_Kit\Tests\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Intents;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Intents\Intents;
use Google\Site_Kit\Core\Intents\REST_Intents_Controller;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

/**
 * @group Intents
 */
class REST_Intents_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Authentication instance.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * URL and arguments of each request sent to the Service.
	 *
	 * @var array[]
	 */
	private $service_requests;

	public function set_up() {
		parent::set_up();

		$this->context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->service_requests = array();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->authentication = new Authentication( $this->context, null, new User_Options( $this->context, $user_id ) );

		$intents = new Intents();
		$intents->register_intent( new FakeIntent( 'ads-conversion-tracking' ) );

		remove_all_filters( 'googlesitekit_rest_routes' );
		( new REST_Intents_Controller( $intents, $this->authentication ) )->register();
		$this->register_rest_routes();
	}

	public function tear_down() {
		parent::tear_down();

		// Each test registers its routes on a new REST server.
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Connects the site and the current user to the Site Kit Service.
	 *
	 * @since n.e.x.t
	 */
	private function connect_to_service() {
		$this->fake_proxy_site_connection();
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );
	}

	/**
	 * Makes every outgoing HTTP request return the given status and body.
	 *
	 * Saves the URL and arguments of each request in `$service_requests`.
	 *
	 * @since n.e.x.t
	 *
	 * @param int   $status HTTP status to return.
	 * @param array $body   Body to return.
	 */
	private function mock_service_response( $status, array $body ) {
		$this->subscribe_to_wp_http_requests(
			function ( $url, $args ) {
				$this->service_requests[] = array(
					'url'  => $url,
					'args' => $args,
				);
			},
			array(
				'headers'  => array(),
				'body'     => wp_json_encode( $body ),
				'response' => array(
					'code'    => $status,
					'message' => get_status_header_desc( $status ),
				),
				'cookies'  => array(),
			)
		);
	}

	/**
	 * Sends a request to the `core/intents/data/intent` route.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $query Query parameters.
	 * @return \WP_REST_Response Response from the route.
	 */
	private function get_intent( array $query ) {
		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/intents/data/intent' );
		$request->set_query_params( $query );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Sends a request to the `core/intents/data/complete-intent` route.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $data Value of the `data` parameter.
	 * @return \WP_REST_Response Response from the route.
	 */
	private function complete_intent( array $data ) {
		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/intents/data/complete-intent' );
		$request->set_body_params( array( 'data' => $data ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Switches the current user to a new editor who can view the shared dashboard but can't set up Site Kit.
	 *
	 * @since n.e.x.t
	 */
	private function switch_to_view_only_user() {
		$this->fake_proxy_site_connection();

		// A view-only user can view the dashboard only after setup is complete.
		// At priority 100, `__return_true` runs after Search Console's filter, which returns `false` for a site with no property.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		( new Module_Sharing_Settings( new Options( $this->context ) ) )->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
					'management'  => 'all_admins',
				),
			)
		);

		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		// A view-only user can't view the dashboard until they dismiss the splash screen.
		( new Dismissed_Items( new User_Options( $this->context, $user_id ) ) )->add( 'shared_dashboard_splash' );

		$this->assertTrue( current_user_can( Permissions::VIEW_DASHBOARD ), 'The editor should be able to view the shared dashboard.' );
		$this->assertFalse( current_user_can( Permissions::SETUP ), 'The editor should not be able to set up Site Kit.' );
	}

	public function test_register__adds_no_preload_path() {
		$preload_paths = apply_filters( 'googlesitekit_apifetch_preload_paths', array() );

		$this->assertNotContains( '/google-site-kit/v1/core/intents/data/intent', $preload_paths, '`googlesitekit_apifetch_preload_paths` should not include the `core/intents/data/intent` route.' );
		$this->assertNotContains( '/google-site-kit/v1/core/intents/data/complete-intent', $preload_paths, '`googlesitekit_apifetch_preload_paths` should not include the `core/intents/data/complete-intent` route.' );
	}

	public function test_intent_route__returns_the_intent_the_service_sent() {
		$this->connect_to_service();
		$this->mock_service_response(
			200,
			array(
				'intent'  => 'ads-conversion-tracking',
				'created' => '2026-07-30T10:15:00Z',
				'payload' => array(
					'tag_id'        => 'AW-123456789',
					'customer_name' => 'Example Store',
					'consent_date'  => '2026-07-28',
				),
			)
		);

		$response = $this->get_intent(
			array(
				'slug'        => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		$this->assertEquals( 200, $response->get_status(), 'The `core/intents/data/intent` route should return a 200 status.' );
		$this->assertEquals(
			array(
				'intent'  => 'ads-conversion-tracking',
				'created' => '2026-07-30T10:15:00Z',
				'payload' => array(
					'tag_id'        => 'AW-123456789',
					'customer_name' => 'Example Store',
					'consent_date'  => '2026-07-28',
				),
			),
			$response->get_data(),
			'The `core/intents/data/intent` route should return the intent the Service sent.'
		);
		$this->assertStringEndsWith( '/intent/ads-conversion-tracking/', $this->service_requests[0]['url'], 'The Service should be asked for the `ads-conversion-tracking` intent.' );
		$this->assertEquals( 'abc123', $this->service_requests[0]['args']['body']['intent_code'], 'The Service should receive the intent code from the request.' );
	}

	public function test_complete_intent_route__returns_the_return_url_the_service_sent() {
		$this->connect_to_service();
		$this->mock_service_response( 200, array( 'return_url' => 'https://example.com/ads/conversions' ) );

		$response = $this->complete_intent(
			array(
				'slug'        => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		$this->assertEquals( 200, $response->get_status(), 'The `core/intents/data/complete-intent` route should return a 200 status.' );
		$this->assertEquals( array( 'return_url' => 'https://example.com/ads/conversions' ), $response->get_data(), 'The `core/intents/data/complete-intent` route should return the URL the Service sent.' );
		$this->assertStringEndsWith( '/intent/ads-conversion-tracking/complete/', $this->service_requests[0]['url'], 'The Service should be asked to complete the `ads-conversion-tracking` intent.' );
		$this->assertEquals( 'abc123', $this->service_requests[0]['args']['body']['intent_code'], 'The Service should receive the intent code from the request.' );
	}

	public function test_intent_route__returns_403_for_a_view_only_dashboard_user() {
		$this->switch_to_view_only_user();
		$this->mock_service_response( 200, array() );

		$response = $this->get_intent(
			array(
				'slug'        => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		$this->assertEquals( 403, $response->get_status(), 'A view-only dashboard user should get a 403 from the `core/intents/data/intent` route.' );
		$this->assertCount( 0, $this->service_requests, 'The plugin should send no request to the Service for a view-only dashboard user.' );
	}

	public function test_complete_intent_route__returns_403_for_a_view_only_dashboard_user() {
		$this->switch_to_view_only_user();
		$this->mock_service_response( 200, array() );

		$response = $this->complete_intent(
			array(
				'slug'        => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		$this->assertEquals( 403, $response->get_status(), 'A view-only dashboard user should get a 403 from the `core/intents/data/complete-intent` route.' );
		$this->assertCount( 0, $this->service_requests, 'The plugin should send no request to the Service for a view-only dashboard user.' );
	}

	public function test_intent_route__returns_intent_user_not_connected_for_a_user_with_no_access_token() {
		$this->fake_proxy_site_connection();
		$this->mock_service_response( 200, array() );

		$response = $this->get_intent(
			array(
				'slug'        => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		$this->assertEquals( 'intent_user_not_connected', $response->get_data()['code'], 'A user with no access token should get the `intent_user_not_connected` error.' );
		$this->assertEquals( 403, $response->get_status(), 'A user with no access token should get a 403.' );
		$this->assertCount( 0, $this->service_requests, 'The plugin should send no request to the Service when the user has no access token.' );
	}

	public function test_intent_route__returns_intent_not_found_for_an_unregistered_intent() {
		$this->connect_to_service();
		$this->mock_service_response( 200, array() );

		$response = $this->get_intent(
			array(
				'slug'        => 'unregistered-intent',
				'intent_code' => 'abc123',
			)
		);

		$this->assertEquals( 'intent_not_found', $response->get_data()['code'], 'An unregistered intent should get the `intent_not_found` error.' );
		$this->assertEquals( 404, $response->get_status(), 'An unregistered intent should get a 404.' );
		$this->assertCount( 0, $this->service_requests, 'The plugin should send no request to the Service for an unregistered intent.' );
	}

	/**
	 * @dataProvider data_service_errors
	 */
	public function test_intent_route__returns_intent_not_found_for_service_errors( $service_status, $service_error_code ) {
		$this->connect_to_service();
		$this->mock_service_response(
			$service_status,
			array(
				'error'      => 'Raw Service message.',
				'error_code' => $service_error_code,
			)
		);

		$response = $this->get_intent(
			array(
				'slug'        => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		$this->assertEquals( 'intent_not_found', $response->get_data()['code'], "The `core/intents/data/intent` route should answer the Service's `$service_error_code` with `intent_not_found`." );
		$this->assertEquals( 404, $response->get_status(), 'The `intent_not_found` error should have a 404 status.' );
		$this->assertStringNotContainsString( 'Raw Service message.', wp_json_encode( $response->get_data() ), 'The response should not include the Service message.' );
	}

	public function data_service_errors() {
		return array(
			'an intent the Service cannot find' => array( 404, 'intent_not_found' ),
			'an internal error in the Service'  => array( 500, 'internal_error' ),
		);
	}

	public function test_intent_route__returns_400_when_the_slug_is_missing() {
		$this->connect_to_service();
		$this->mock_service_response( 200, array() );

		$response = $this->get_intent( array( 'intent_code' => 'abc123' ) );

		$this->assertEquals( 400, $response->get_status(), 'A request with no `slug` should get a 400.' );
		$this->assertCount( 0, $this->service_requests, 'The plugin should send no request to the Service when `slug` is missing.' );
	}

	public function test_intent_route__returns_400_when_the_intent_code_is_missing() {
		$this->connect_to_service();
		$this->mock_service_response( 200, array() );

		$response = $this->get_intent( array( 'slug' => 'ads-conversion-tracking' ) );

		$this->assertEquals( 400, $response->get_status(), 'A request with no `intent_code` should get a 400.' );
		$this->assertCount( 0, $this->service_requests, 'The plugin should send no request to the Service when `intent_code` is missing.' );
	}
}
