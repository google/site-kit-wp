<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication\Google_ProxyTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
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

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Google proxy object.
	 *
	 * @var Google_Proxy
	 */
	private $proxy;

	public function setUp() {
		parent::setUp();

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->google_proxy = new Google_Proxy( $this->context );
	}

	private function get_credentials() {
		$credentials = new Credentials( new Options( $this->context ) );
		$fake_creds  = $this->fake_proxy_site_connection();
		return array( $credentials, $fake_creds );
	}

	public function test_get_site_fields() {
		$this->assertEqualSetsWithIndex(
			array(
				'url'                    => home_url(),
				'action_uri'             => admin_url( 'index.php' ),
				'name'                   => get_bloginfo( 'name' ),
				'return_uri'             => $this->context->admin_url( 'splash' ),
				'redirect_uri'           => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
				'analytics_redirect_uri' => add_query_arg( 'gatoscallback', 1, admin_url( 'index.php' ) ),
			),
			$this->google_proxy->get_site_fields()
		);
	}

	public function test_fetch_site_fields() {
		list ( $credentials ) = $this->get_credentials();

		$pre_args = null;
		$pre_url  = null;

		// Use pre_http_request for backwards compatibility as http_api_debug is not fired for blocked requests before WP 5.3
		add_filter(
			'pre_http_request',
			function ( $_, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $_;
			},
			10,
			3
		);

		// Force WP_Error response from as http requests are blocked.
		$mock_url   = $this->google_proxy->url( Google_Proxy::OAUTH2_SITE_URI );
		$mock_error = new WP_Error( 'test_error', 'test_error_message' );

		// Ensure WP_Error response is passed through.
		$this->mock_http_failure( $mock_url, $mock_error );
		$error_response_data = $this->google_proxy->fetch_site_fields( $credentials );
		$this->assertWPErrorWithMessage( 'test_error_message', $error_response_data );

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
		$this->mock_http_request( $mock_url, $mock_response );
		$this->google_proxy->fetch_site_fields( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $mock_url, $pre_url );
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
		list ( $credentials ) = $this->get_credentials();

		$pre_args = null;
		$pre_url  = null;

		add_filter(
			'pre_http_request',
			function ( $_, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $_;
			},
			10,
			3
		);

		// Mock matching reponse.
		$matching_mock_url      = $this->google_proxy->url( Google_Proxy::OAUTH2_SITE_URI );
		$matching_mock_response = array(
			'url'                    => home_url(),
			'action_uri'             => admin_url( 'index.php' ),
			'name'                   => get_bloginfo( 'name' ),
			'return_uri'             => $this->context->admin_url( 'splash' ),
			'redirect_uri'           => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
			'analytics_redirect_uri' => add_query_arg( 'gatoscallback', 1, admin_url( 'index.php' ) ),
		);

		$this->mock_http_request( $matching_mock_url, $matching_mock_response );
		$success_response_data = $this->google_proxy->are_site_fields_synced( $credentials );

		// Ensure matching response array returns true.
		$this->assertEquals( $success_response_data, true );

		// Mock non matching response.
		$mock_non_matching_response = array( 'incorrect', 'keys' );

		$this->mock_http_request( $matching_mock_url, $mock_non_matching_response );
		$failure_response_data = $this->google_proxy->are_site_fields_synced( $credentials );

		// Ensure non-matching response array returns false.
		$this->assertEquals( $failure_response_data, false );
	}

	public function test_get_user_fields() {
		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$this->assertEqualSetsWithIndex(
			array(
				'user_roles' => 'editor',
			),
			$this->google_proxy->get_user_fields()
		);

		// WordPress technically allows for multiple roles, and some plugins
		// make use of that feature - we can just fake it like below.
		wp_get_current_user()->roles[] = 'shop_vendor';

		$this->assertEqualSetsWithIndex(
			array(
				'user_roles' => 'editor,shop_vendor',
			),
			$this->google_proxy->get_user_fields()
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_get_user_fields_for_network_administrator() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( $user_id );
		wp_set_current_user( $user_id );

		$this->assertEqualSetsWithIndex(
			array(
				'user_roles' => 'administrator,network_administrator',
			),
			$this->google_proxy->get_user_fields()
		);
	}

	public function test_unregister_site() {
		list ( $credentials, $fake_creds ) = $this->get_credentials();

		$pre_args = null;
		$pre_url  = null;

		add_filter(
			'pre_http_request',
			function ( $_, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $_;
			},
			10,
			3
		);

		$expected_success_response = array( 'success' => true );
		$expected_url              = $this->google_proxy->url( Google_Proxy::OAUTH2_DELETE_SITE_URI );

		$this->mock_http_request( $expected_url, $expected_success_response );
		$response_data = $this->google_proxy->unregister_site( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $expected_url, $pre_url );
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
		$this->mock_http_request( $expected_url, $expected_error_response, 400 );

		// Ensure error with correct message is returned for error response.
		$error_response_data = $this->google_proxy->unregister_site( $credentials );
		$this->assertWPErrorWithMessage( $expected_error_response['error'], $error_response_data );
	}

	public function test_sync_site_fields() {
		list ( $credentials ) = $this->get_credentials();

		$pre_args = null;
		$pre_url  = null;

		// Use pre_http_request for backwards compatibility as http_api_debug is not fired for blocked requests before WP 5.3
		add_filter(
			'pre_http_request',
			function ( $_, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $_;
			},
			10,
			3
		);

		$this->google_proxy->sync_site_fields( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $this->google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ), $pre_url );
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
		$expected_credentials = array(
			'site_id'     => 'test-site-id.apps.sitekit.withgoogle.com',
			'site_secret' => 'test-site-secret',
		);

		// Stub the response to the proxy oauth API.
		$this->mock_http_request(
			$this->google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ),
			$expected_credentials
		);

		$credentials = $this->google_proxy->exchange_site_code( 'test-site-code', 'test-undelegated-code' );
		$this->assertEqualSetsWithIndex(
			$expected_credentials,
			$credentials
		);
	}

	public function test_get_features() {
		list ( $credentials, $fake_creds ) = $this->get_credentials();

		$pre_args = null;
		$pre_url  = null;

		add_filter(
			'pre_http_request',
			function ( $_, $args, $url ) use ( &$pre_args, &$pre_url ) {
				$pre_args = $args;
				$pre_url  = $url;

				return $_;
			},
			10,
			3
		);

		$expected_url              = $this->google_proxy->url( Google_Proxy::FEATURES_URI );
		$expected_success_response = array(
			'userInput'         => array( 'enabled' => true ),
			'widgets.dashboard' => array( 'enabled' => true ),
		);

		$this->mock_http_request( $expected_url, $expected_success_response );
		$features = $this->google_proxy->get_features( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $expected_url, $pre_url );
		$this->assertEquals( 'POST', $pre_args['method'] );
		if ( is_multisite() ) {
			$this->assertEqualSetsWithIndex(
				array(
					'platform'    => 'wordpress-multisite/google-site-kit',
					'version'     => GOOGLESITEKIT_VERSION,
					'site_id'     => $fake_creds['client_id'],
					'site_secret' => $fake_creds['client_secret'],
				),
				$pre_args['body']
			);
		} else {
			$this->assertEqualSetsWithIndex(
				array(
					'platform'    => 'wordpress/google-site-kit',
					'version'     => GOOGLESITEKIT_VERSION,
					'site_id'     => $fake_creds['client_id'],
					'site_secret' => $fake_creds['client_secret'],
				),
				$pre_args['body']
			);
		}
		$this->assertEqualSetsWithIndex( $expected_success_response, $features );
	}

	public function test_get_platform() {
		$platform = $this->google_proxy->get_platform();

		if ( is_multisite() ) {
			$this->assertEquals( 'wordpress-multisite', $platform );
		} else {
			$this->assertEquals( 'wordpress', $platform ); // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled
		}
	}

	/**
	 * Adds a 'pre_http_request' filter that will ensure the request for the
	 * given URL will yield a specific response.
	 *
	 * @param string $request_url   Request URL to modify response for.
	 * @param (array)  $response_data Response data to return for the request. Will be JSON-encoded if it is an array.
	 * @param int    $response_code Optional. Response status code to return. Default 200.
	 */
	private function mock_http_request( $request_url, array $response_data, $response_code = 200 ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $request_url, $response_data, $response_code ) {
				if ( $request_url !== $url ) {
					return $preempt;
				}

				return array(
					'headers'       => array(),
					'body'          => json_encode( $response_data ),
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

	/**
	 * Adds a 'pre_http_request' filter that will ensure the request for the
	 * given URL will return WP_Error.
	 *
	 * @param string   $request_url    Request URL to modify response for.
	 * @param WP_Error $response_error Response WP_Error to return.
	 */
	private function mock_http_failure( $request_url, $response_error ) {
		add_filter(
			'pre_http_request',
			function( $response, $parsed_args, $url ) use ( $request_url, $response_error ) {
				if ( $url === $request_url ) {
					return $response_error;
				} else {
					return $response;
				}
			},
			10,
			3
		);
	}

}
