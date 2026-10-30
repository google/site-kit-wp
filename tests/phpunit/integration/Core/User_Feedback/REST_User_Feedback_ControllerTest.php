<?php
/**
 * Class Google\Site_Kit\Tests\Core\User_Feedback\REST_User_Feedback_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Feedback
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Feedback;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\User_Feedback\REST_User_Feedback_Controller;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_User_Feedback_ControllerTest extends TestCase {

	use RestTestTrait;
	use Fake_Site_Connection_Trait;

	/**
	 * REST_User_Feedback_Controller object.
	 *
	 * @var REST_User_Feedback_Controller
	 */
	private $controller;

	/**
	 * Authentication instance.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Valid feedback request data.
	 *
	 * @var array
	 */
	private $valid_feedback = array(
		'namespace' => 'feature_hub',
		'group'     => 'feature_relevancy_analytics-4',
		'key'       => 'vote',
		'value'     => 'up',
	);

	public function set_up() {
		parent::set_up();

		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->authentication = new Authentication( $context );
		$this->controller     = new REST_User_Feedback_Controller( $this->authentication );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$this->controller->register();
		$this->assertTrue(
			has_filter( 'googlesitekit_rest_routes' ),
			'User feedback REST routes should be registered.'
		);
	}

	public function test_register_routes() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$this->controller->register();

		$routes = apply_filters( 'googlesitekit_rest_routes', array() );
		$this->assertEqualSets(
			array( 0 ),
			array_keys( $routes ),
			'User feedback controller should register the feedback REST route.'
		);

		$args = $routes[0]->get_args();
		$this->assertEquals( 'core/user/data/feedback', $routes[0]->get_uri(), 'Feedback route should use the expected URI.' );
		$this->assertEquals( \WP_REST_Server::CREATABLE, $args[0]['methods'], 'Feedback route should accept write requests.' );
		$this->assertTrue(
			is_callable( $args[0]['callback'] ),
			'Feedback route should have a callable request handler.'
		);
		$this->assertTrue(
			is_callable( $args[0]['permission_callback'] ),
			'Feedback route should have a callable permission check.'
		);
		$this->assertTrue(
			! empty( $args[0]['args']['data']['properties']['namespace']['required'] )
				&& ! empty( $args[0]['args']['data']['properties']['group']['required'] )
				&& ! empty( $args[0]['args']['data']['properties']['key']['required'] )
				&& ! empty( $args[0]['args']['data']['properties']['value']['required'] ),
			'Feedback route should require the namespace, group, key, and value fields.'
		);
	}

	/**
	 * Sends a feedback REST request.
	 *
	 * @param array $data Feedback payload, under the `data` key.
	 * @return \WP_REST_Response Response object.
	 */
	private function send_feedback_request( array $data ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/feedback' );
		$request->set_body_params( array( 'data' => $data ) );

		return rest_get_server()->dispatch( $request );
	}

	public function test_feedback() {
		$this->fake_proxy_site_connection();
		$this->authentication
			->get_oauth_client()
			->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->subscribe_to_wp_http_requests(
			function () {},
			array(
				'response' => array( 'code' => 200 ),
				'headers'  => array(),
				'body'     => wp_json_encode( array( 'success' => true ) ),
			)
		);

		$response = $this->send_feedback_request( $this->valid_feedback );

		$this->assertEquals( 200, $response->get_status(), 'A valid feedback request should return a 200 status.' );
		$this->assertEqualSets( array( 'success' => true ), $response->get_data(), 'A successful feedback request should return a success response.' );
	}

	public function test_feedback__returns_service_error() {
		$this->fake_proxy_site_connection();
		$this->authentication
			->get_oauth_client()
			->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->subscribe_to_wp_http_requests(
			function () {},
			array(
				'response' => array( 'code' => 400 ),
				'headers'  => array(),
				'body'     => wp_json_encode( array( 'error' => 'Invalid namespace.' ) ),
			)
		);

		$response = $this->send_feedback_request( $this->valid_feedback );

		$this->assertEquals( 400, $response->get_status(), 'A rejected feedback request should pass through the Service status code.' );
		$this->assertEquals( 'Invalid namespace.', $response->get_data()['message'], 'A rejected feedback request should pass through the Service error message.' );
	}

	public function data_missing_required_fields() {
		return array(
			'missing namespace' => array( 'namespace' ),
			'missing group'     => array( 'group' ),
			'missing key'       => array( 'key' ),
			'missing value'     => array( 'value' ),
		);
	}

	/**
	 * @dataProvider data_missing_required_fields
	 */
	public function test_feedback__requires_field( $missing_field ) {
		$this->fake_proxy_site_connection();
		$this->authentication
			->get_oauth_client()
			->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$data = $this->valid_feedback;
		unset( $data[ $missing_field ] );

		$response = $this->send_feedback_request( $data );

		$this->assertEquals( 400, $response->get_status(), "A feedback request missing {$missing_field} should return a 400 status." );
	}

	/**
	 * @dataProvider data_missing_required_fields
	 */
	public function test_validate_feedback_data__requires_field( $missing_field ) {
		// This exercises `validate_feedback_data()` directly, rather than through a dispatched
		// REST request, because WordPress before 5.5 doesn't enforce `required` on the nested
		// `properties` of an object argument, which would let a request missing one of these
		// fields reach the controller's callback instead of being rejected with a 400 status.
		$data = $this->valid_feedback;
		unset( $data[ $missing_field ] );

		$result = $this->controller->validate_feedback_data( $data );

		$this->assertWPError( $result, "Feedback data missing {$missing_field} should fail validation." );
		$this->assertEquals( 400, $result->get_error_data()['status'], "Feedback data missing {$missing_field} should fail with a 400 status." );
	}

	public function test_validate_feedback_data__requires_object() {
		$result = $this->controller->validate_feedback_data( 'not-an-object' );

		$this->assertWPError( $result, 'A non-object value should fail validation.' );
		$this->assertEquals( 400, $result->get_error_data()['status'], 'A non-object value should fail with a 400 status.' );
	}

	public function test_validate_feedback_data__accepts_valid_data() {
		$this->assertTrue( $this->controller->validate_feedback_data( $this->valid_feedback ), 'Valid feedback data should pass validation.' );
	}

	public function test_feedback__requires_authentication() {
		// No access token is set, so the user is not authenticated with the Service.
		$response = $this->send_feedback_request( $this->valid_feedback );

		$this->assertEquals( 403, $response->get_status(), 'A request from a logged-in user who is not authenticated with the Service should be rejected.' );
	}

	public function test_feedback__requires_proxy_connection() {
		$this->authentication
			->get_oauth_client()
			->set_token( array( 'access_token' => 'valid-auth-token' ) );

		// Fakes a non-proxy connection by storing credentials with a client ID that isn't a proxy client ID.
		$this->fake_site_connection();

		$response = $this->send_feedback_request( $this->valid_feedback );

		$this->assertEquals( 403, $response->get_status(), 'A request from a site that is not connected via the proxy should be rejected.' );
	}
}
