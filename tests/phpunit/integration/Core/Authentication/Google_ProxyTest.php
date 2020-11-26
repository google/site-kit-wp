<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication\Google_ProxyTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use WP_Error;
use Exception;

/**
 * @group Authentication
 */
class Google_ProxyTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_get_site_fields() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );

		$this->assertEqualSetsWithIndex(
			array(
				'url'                    => home_url(),
				'action_uri'             => admin_url( 'index.php' ),
				'name'                   => get_bloginfo( 'name' ),
				'return_uri'             => $context->admin_url( 'splash' ),
				'redirect_uri'           => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
				'analytics_redirect_uri' => add_query_arg( 'gatoscallback', 1, admin_url( 'index.php' ) ),
			),
			$google_proxy->get_site_fields()
		);
	}

	public function test_fetch_site_fields() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );
		$credentials  = new Credentials( new Options( $context ) );

		$this->fake_proxy_site_connection();

		$pre_args = null;
		$pre_url  = null;

		// Use pre_http_request for backwards compatibility as http_api_debug is not fired for blocked requests before WP 5.3
		add_filter(
			'pre_http_request',
			function ( $false, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $false;
			},
			10,
			3
		);

		// Mock reponse.
		$mock_response = array(
			'site_id',
			'site_secret',
			'url',
			'name',
			'redirect_uri',
			'return_uri',
			'action_uri',
			'analytics_redirect_uri',
		);
		$this->mock_http_request(
			$google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ),
			$mock_response
		);
		$google_proxy->fetch_site_fields( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ), $pre_url );
		$this->assertEquals( 'POST', $pre_args['method'] );

		$this->assertEqualSets(
			array(
				'site_id',
				'site_secret',
			),
			array_keys( $pre_args['body'] )
		);
	}

	public function test_are_site_fields_synced() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );
		$credentials  = new Credentials( new Options( $context ) );

		$fake_creds = $this->fake_proxy_site_connection();

		$pre_args = null;
		$pre_url  = null;

		add_filter(
			'pre_http_request',
			function ( $false, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $false;
			},
			10,
			3
		);

		// Mock matching reponse.
		$matching_mock_response = array(
			'url'                    => home_url(),
			'action_uri'             => admin_url( 'index.php' ),
			'name'                   => get_bloginfo( 'name' ),
			'return_uri'             => $context->admin_url( 'splash' ),
			'redirect_uri'           => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
			'analytics_redirect_uri' => add_query_arg( 'gatoscallback', 1, admin_url( 'index.php' ) ),
		);
		$this->mock_http_request(
			$google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ),
			$matching_mock_response
		);
		$success_response_data = $google_proxy->are_site_fields_synced( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ), $pre_url );
		$this->assertEquals( 'POST', $pre_args['method'] );
		$this->assertEqualSetsWithIndex(
			array(
				'site_id',
				'site_secret',
			),
			array_keys( $pre_args['body'] )
		);

		// Mock WP_Error response
		$mock_wp_error_response = new WP_Error();
		$this->mock_http_request(
			$google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ),
			$mock_wp_error_response
		);
		$error_response_data = $google_proxy->are_site_fields_synced( $credentials );

		// Mock non matching response.
		$mock_non_matching_response = array(
			'incorrect',
			'keys',
		);
		$this->mock_http_request(
			$google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ),
			$mock_non_matching_response
		);
		$failure_response_data = $google_proxy->are_site_fields_synced( $credentials );

		// Ensure matching response array returns true.
		$this->assertEquals( $success_response_data, true );
		// Ensure WP_Error response returns WP_Error.
		$this->assertEquals( is_wp_error( $error_response_data ), true );
		// Ensure non-matching response array returns false.
		$this->assertEquals( $failure_response_data, false );
	}

	public function test_get_user_fields() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );

		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$this->assertEqualSetsWithIndex(
			array(
				'user_roles' => 'editor',
			),
			$google_proxy->get_user_fields()
		);

		// WordPress technically allows for multiple roles, and some plugins
		// make use of that feature - we can just fake it like below.
		wp_get_current_user()->roles[] = 'shop_vendor';

		$this->assertEqualSetsWithIndex(
			array(
				'user_roles' => 'editor,shop_vendor',
			),
			$google_proxy->get_user_fields()
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_get_user_fields_for_network_administrator() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( $user_id );
		wp_set_current_user( $user_id );

		$this->assertEqualSetsWithIndex(
			array(
				'user_roles' => 'administrator,network_administrator',
			),
			$google_proxy->get_user_fields()
		);
	}

	public function test_unregister_site() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );
		$credentials  = new Credentials( new Options( $context ) );

		$fake_creds = $this->fake_proxy_site_connection();

		$pre_args = null;
		$pre_url  = null;

		add_filter(
			'pre_http_request',
			function ( $false, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $false;
			},
			10,
			3
		);

		$expected_success_response = array( 'success' => true );
		$this->mock_http_request(
			$google_proxy->url( Google_Proxy::OAUTH2_DELETE_SITE_URI ),
			$expected_success_response
		);
		$response_data = $google_proxy->unregister_site( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $google_proxy->url( Google_Proxy::OAUTH2_DELETE_SITE_URI ), $pre_url );
		$this->assertEquals( 'POST', $pre_args['method'] );
		$this->assertEqualSetsWithIndex(
			array(
				'site_id'     => $fake_creds['client_id'],
				'site_secret' => $fake_creds['client_secret'],
			),
			$pre_args['body']
		);

		// Ensure success response data is correct.
		$this->assertEquals( $expected_success_response, $response_data );

		$expected_error_response = array( 'error' => "invalid 'site_id' or 'site_secret'" );
		$this->mock_http_request(
			$google_proxy->url( Google_Proxy::OAUTH2_DELETE_SITE_URI ),
			$expected_error_response,
			400
		);

		// Ensure exception with correct message is thrown for error response.
		try {
			$google_proxy->unregister_site( $credentials );
			$this->fail( 'Expected an exception to be thrown when unregistering the site' );
		} catch ( Exception $e ) {
			$this->assertEquals( $expected_error_response['error'], $e->getMessage() );
		}
	}

	public function test_sync_site_fields() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );
		$credentials  = new Credentials( new Options( $context ) );

		$this->fake_proxy_site_connection();

		$pre_args = null;
		$pre_url  = null;

		// Use pre_http_request for backwards compatibility as http_api_debug is not fired for blocked requests before WP 5.3
		add_filter(
			'pre_http_request',
			function ( $false, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $false;
			},
			10,
			3
		);

		$google_proxy->sync_site_fields( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ), $pre_url );
		$this->assertEquals( 'POST', $pre_args['method'] );
		$this->assertEqualSets(
			array(
				'site_id',
				'site_secret',
				'url',
				'name',
				'redirect_uri',
				'return_uri',
				'action_uri',
				'analytics_redirect_uri',
			),
			array_keys( $pre_args['body'] )
		);
	}

	public function test_exchange_site_code() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$google_proxy = new Google_Proxy( $context );

		$expected_credentials = array(
			'site_id'     => 'test-site-id.apps.sitekit.withgoogle.com',
			'site_secret' => 'test-site-secret',
		);

		// Stub the response to the proxy oauth API.
		$this->mock_http_request(
			$google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ),
			$expected_credentials
		);

		$credentials = $google_proxy->exchange_site_code( 'test-site-code', 'test-undelegated-code' );
		$this->assertEqualSetsWithIndex(
			$expected_credentials,
			$credentials
		);
	}

	/**
	 * Adds a 'pre_http_request' filter that will ensure the request for the
	 * given URL will yield a specific response.
	 *
	 * @param string $request_url   Request URL to modify response for.
	 * @param (array|WP_Error)  $response_data Response data to return for the request. Will be JSON-encoded if it is an array.
	 * @param int    $response_code Optional. Response status code to return. Default 200.
	 */
	private function mock_http_request( $request_url, $response_data, $response_code = 200 ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $request_url, $response_data, $response_code ) {
				if ( $request_url !== $url ) {
					return $preempt;
				}

				if ( is_array( $response_data ) ) {
					$response_data = json_encode( $response_data );
				}

				return array(
					'headers'       => array(),
					'body'          => $response_data,
					'response'      => array(
						'code'    => $response_code,
						'message' => get_status_header_desc( $response_code ),
					),
					'cookies'       => array(),
					'http_response' => null,
				);
			},
			10,
			3
		);
	}
}
