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
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\User_Options;

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
	private $google_proxy;

	/**
	 * The last HTTP request URL.
	 *
	 * @var string
	 */
	private $request_url;

	/**
	 * The last HTTP request arguments.
	 *
	 * @var array
	 */
	private $request_args;

	public function set_up() {
		parent::set_up();

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->google_proxy = new Google_Proxy( $this->context );
	}

	private function get_credentials() {
		$credentials = new Credentials( new Options( $this->context ) );

		list( $site_id, $site_secret ) = $this->fake_proxy_site_connection();

		return array( $credentials, $site_id, $site_secret );
	}

	public function test_setup_url() {
		// Ensure the correct URL is returned with the given query parameters.
		$url = $this->google_proxy->setup_url(
			array(
				'code'    => 'code-123',
				'site_id' => 'site_id-456',
				'foo'     => 'foo-789',
			)
		);
		$this->assertEquals( $url, 'https://sitekit.withgoogle.com/v2/site-management/setup/?code=code-123&site_id=site_id-456&foo=foo-789' );

		$url = $this->google_proxy->setup_url(
			array(
				'code'      => 'code-123',
				'site_code' => 'site_code-456',
			)
		);
		$this->assertEquals( $url, 'https://sitekit.withgoogle.com/v2/site-management/setup/?code=code-123&site_code=site_code-456' );

		// Check an exception is thrown when `code` query param is not passed.
		try {
			$this->google_proxy->setup_url( array() );
			$this->fail( 'Expected Exception to be thrown' );
		} catch ( Exception $e ) {
			$this->assertEquals( 'Missing code parameter for setup URL.', $e->getMessage() );
		}

		// Check an exception is thrown when neither `site_id` or `site_code` query param is passed.
		try {
			$this->google_proxy->setup_url( array( 'code' => 'code-123' ) );
			$this->fail( 'Expected Exception to be thrown' );
		} catch ( Exception $e ) {
			$this->assertEquals( 'Missing site_id or site_code parameter for setup URL.', $e->getMessage() );
		}
	}

	public function test_add_setup_step_from_error_code() {
		// Ensure the `step` query param is correctly added according to the error code.
		$params = $this->google_proxy->add_setup_step_from_error_code( array(), 'missing_verification' );
		$this->assertEquals( $params['step'], 'verification' );

		$params = $this->google_proxy->add_setup_step_from_error_code( array(), 'missing_delegation_consent' );
		$this->assertEquals( $params['step'], 'delegation_consent' );

		$params = $this->google_proxy->add_setup_step_from_error_code( array(), 'missing_search_console_property' );
		$this->assertEquals( $params['step'], 'search_console_property' );

		// Ensure the `step` query param is not added for an unhandled error code.
		$params = $this->google_proxy->add_setup_step_from_error_code( array(), 'something_unhandled' );
		$this->assertEqualSets( $params, array() );

		// Ensure existing params are retained.
		$params = $this->google_proxy->add_setup_step_from_error_code( array( 'foo' => 123 ), 'missing_verification' );
		$this->assertEqualSets(
			$params,
			array(
				'foo'  => 123,
				'step' => 'verification',
			)
		);
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
		$this->assertEquals( $mock_url, $this->request_url );
		$this->assertEquals( 'POST', $this->request_args['method'] );
		$this->assertEqualSets(
			array(
				'site_id',
				'site_secret',
			),
			array_keys( $this->request_args['body'] )
		);
	}

	public function test_are_site_fields_synced() {
		list ( $credentials ) = $this->get_credentials();

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

	public function test_url_handles_staging() {
		$url = $this->google_proxy->url();
		$this->assertEquals( $url, Google_Proxy::PRODUCTION_BASE_URL );
		// The test for this behaviour depends on a constant value which can
		// only be redefined if PECL extension runkit/7 is installed.
		if ( ! extension_loaded( 'runkit7' ) && ! extension_loaded( 'runkit' ) ) {
			$this->markTestSkipped( 'The runkit7 or runkit extension is not available.' );
		}

		define( 'GOOGLESITEKIT_PROXY_URL', Google_Proxy::STAGING_BASE_URL );
		$url = $this->google_proxy->url();
		$this->assertEquals( $url, Google_Proxy::STAGING_BASE_URL );
		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'GOOGLESITEKIT_PROXY_URL' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'GOOGLESITEKIT_PROXY_URL' );
		}
	}

	public function test_url_handles_development() {
		$url = $this->google_proxy->url();
		$this->assertEquals( $url, Google_Proxy::PRODUCTION_BASE_URL );
		// The test for this behaviour depends on a constant value which can
		// only be redefined if PECL extension runkit/7 is installed.
		if ( ! extension_loaded( 'runkit7' ) && ! extension_loaded( 'runkit' ) ) {
			$this->markTestSkipped( 'The runkit7 or runkit extension is not available.' );
		}

		define( 'GOOGLESITEKIT_PROXY_URL', Google_Proxy::DEVELOPMENT_BASE_URL );
		$url = $this->google_proxy->url();
		$this->assertEquals( $url, Google_Proxy::DEVELOPMENT_BASE_URL );
		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'GOOGLESITEKIT_PROXY_URL' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'GOOGLESITEKIT_PROXY_URL' );
		}
	}

	public function test_url_ignores_invalid_values() {
		// The test for this behaviour depends on a constant value which can
		// only be redefined if PECL extension runkit/7 is installed.
		if ( ! extension_loaded( 'runkit7' ) && ! extension_loaded( 'runkit' ) ) {
			$this->markTestSkipped( 'The runkit7 or runkit extension is not available.' );
		}
		define( 'GOOGLESITEKIT_PROXY_URL', 'https://example.com' );
		$url = $this->google_proxy->url();
		$this->assertEquals( $url, Google_Proxy::PRODUCTION_BASE_URL );
		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'GOOGLESITEKIT_PROXY_URL' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'GOOGLESITEKIT_PROXY_URL' );
		}
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
		list ( $credentials, $site_id, $site_secret ) = $this->get_credentials();

		$expected_success_response = array( 'success' => true );
		$expected_url              = $this->google_proxy->url( Google_Proxy::OAUTH2_DELETE_SITE_URI );

		$this->mock_http_request( $expected_url, $expected_success_response );
		$response_data = $this->google_proxy->unregister_site( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $expected_url, $this->request_url );
		$this->assertEquals( 'POST', $this->request_args['method'] );
		$this->assertEqualSetsWithIndex(
			array(
				'site_id'     => $site_id,
				'site_secret' => $site_secret,
			),
			$this->request_args['body']
		);

		// Ensure success response data is correct.
		$this->assertEquals( $expected_success_response, $response_data );

		$expected_error_response = array( 'error' => "invalid 'site_id' or 'site_secret'" );
		$this->mock_http_request( $expected_url, $expected_error_response, 400 );

		// Ensure error with correct message is returned for error response.
		$error_response_data = $this->google_proxy->unregister_site( $credentials );
		$this->assertWPErrorWithMessage( $expected_error_response['error'], $error_response_data );
	}

	public function test_register_site() {
		$expected_url              = $this->google_proxy->url( Google_Proxy::OAUTH2_SITE_URI );
		$expected_success_response = array();

		$this->mock_http_request( $expected_url, $expected_success_response );
		$this->google_proxy->register_site();

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $expected_url, $this->request_url );
		$this->assertEquals( 'POST', $this->request_args['method'] );
		$this->assertEqualSets(
			array(
				'action_uri',
				'analytics_redirect_uri',
				'application_name',
				'hl',
				'mode',
				'name',
				'nonce',
				'redirect_uri',
				'return_uri',
				'scope',
				'service_version',
				'supports',
				'url',
				'user_roles',
			),
			array_keys( $this->request_args['body'] )
		);
	}

	public function test_sync_site_fields() {
		list ( $credentials ) = $this->get_credentials();

		$expected_url              = $this->google_proxy->url( Google_Proxy::OAUTH2_SITE_URI );
		$expected_success_response = array();

		$this->mock_http_request( $expected_url, $expected_success_response );
		$this->google_proxy->sync_site_fields( $credentials );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $expected_url, $this->request_url );
		$this->assertEquals( 'POST', $this->request_args['method'] );
		$this->assertEqualSets(
			array(
				'action_uri',
				'analytics_redirect_uri',
				'application_name',
				'hl',
				'mode',
				'name',
				'nonce',
				'redirect_uri',
				'return_uri',
				'scope',
				'service_version',
				'site_id',
				'site_secret',
				'supports',
				'url',
				'user_roles',
			),
			array_keys( $this->request_args['body'] )
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
		global $wp_version;

		list ( $credentials, $site_id, $site_secret ) = $this->get_credentials();

		// Create one more administrator and 3 non-administrators.
		$this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->factory()->user->create_many( 2, array( 'role' => 'editor' ) );
		$this->factory()->user->create( array( 'role' => 'subscriber' ) );

		$expected_url              = $this->google_proxy->url( Google_Proxy::FEATURES_URI );
		$expected_success_response = array(
			'gm3Components'    => array( 'enabled' => true ),
			'test.featureName' => array( 'enabled' => true ),
		);

		$this->mock_http_request( $expected_url, $expected_success_response );
		$features = $this->google_proxy->get_features( $credentials, new OAuth_Client( $this->context, null, null, $credentials, $this->google_proxy ) );

		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $expected_url, $this->request_url );
		$this->assertEquals( 'POST', $this->request_args['method'] );
		$this->assertEqualSetsWithIndex(
			array(
				'site_id'                => $site_id,
				'site_secret'            => $site_secret,
				'platform'               => is_multisite() ? 'wordpress-multisite/google-site-kit' : 'wordpress/google-site-kit',
				'version'                => GOOGLESITEKIT_VERSION,
				'platform_version'       => $wp_version,
				'user_count'             => 5, // 1 default admin + 1 admin + 2 editors + 1 subscriber.
				'connectable_user_count' => 2, // 2 admins.
				'connected_user_count'   => 0, // No authenticated users - tested in test_count_connected_users() below.
				'active_modules'         => 'site-verification search-console pagespeed-insights',
				'connected_modules'      => 'site-verification search-console pagespeed-insights',
				'php_version'            => phpversion(),
			),
			$this->request_args['body']
		);
		$this->assertEqualSetsWithIndex( $expected_success_response, $features );
	}

	public function test_count_connected_users() {
		$context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$meta_key = ( new User_Options( $context ) )->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );

		// Test there are no connected users to begin with.
		$this->assertEquals( 0, $this->google_proxy->count_connected_users() );

		// Create and connect an administrator.
		$administrator_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		update_user_meta( $administrator_id, $meta_key, 'test-access-token' );
		$this->assertEquals( 1, $this->google_proxy->count_connected_users() );

		// Create another administrator who is not connected.
		$administrator_2_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->assertEquals( 1, $this->google_proxy->count_connected_users() );

		// Connect administrator_2.
		update_user_meta( $administrator_2_id, $meta_key, 'test-access-token' );
		$this->assertEquals( 2, $this->google_proxy->count_connected_users() );
	}

	/**
	 * @group ms-excluded
	 */
	public function test_get_platform() {
		$this->assertEquals( 'wordpress', Google_Proxy::get_platform() ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText
	}

	/**
	 * @group ms-required
	 */
	public function test_get_platform__multiste() {
		$this->assertEquals( 'wordpress-multisite', Google_Proxy::get_platform() );
	}

	public function test_send_survey_trigger() {
		list ( $credentials, $site_id, $site_secret ) = $this->get_credentials();

		$expected_url              = $this->google_proxy->url( Google_Proxy::SURVEY_TRIGGER_URI );
		$expected_success_response = array(
			'no_available_survey_reason' => '',
			'survey_id'                  => 'xyz',
			'survey_payload'             => array(
				'language' => 'en_US',
				'question' => array(
					'question_ordinal' => '1',
					'question_text'    => 'What time is it?',
					'question_type'    => 'open_text',
				),
			),
			'session'                    => array(
				'session_id'    => '0123456789abcdef',
				'session_token' => '0123-4567-89ab-cdef',
			),
		);

		$this->mock_http_request( $expected_url, $expected_success_response );

		$access_token = 'abcd';
		$trigger_id   = '1234';
		$response     = $this->google_proxy->send_survey_trigger( $credentials, $access_token, $trigger_id );

		$this->assertEquals( $expected_url, $this->request_url );
		$this->assertEquals( 'POST', $this->request_args['method'] );

		$this->assertArrayHasKey( 'Authorization', $this->request_args['headers'] );
		$this->assertEquals( "Bearer $access_token", $this->request_args['headers']['Authorization'] );

		$this->assertEqualSetsWithIndex(
			array(
				'site_id'         => $site_id,
				'site_secret'     => $site_secret,
				'trigger_context' => array(
					'trigger_id' => $trigger_id,
					'language'   => 'en_US',
				),
			),
			json_decode( $this->request_args['body'], true )
		);

		$this->assertEqualSetsWithIndex( $expected_success_response, $response );
	}

	public function test_send_survey_event() {
		list ( $credentials, $site_id, $site_secret ) = $this->get_credentials();

		$expected_url              = $this->google_proxy->url( Google_Proxy::SURVEY_EVENT_URI );
		$expected_success_response = array();

		$this->mock_http_request( $expected_url, $expected_success_response );

		$access_token = 'dcba';
		$session      = array(
			'session_id'    => '0123456789abcdef',
			'session_token' => '0123-4567-89ab-cdef',
		);
		$event        = array(
			'survey_shown'  => array(),
			'survey_closed' => array(),
		);

		$response = $this->google_proxy->send_survey_event( $credentials, $access_token, $session, $event );

		$this->assertEquals( $expected_url, $this->request_url );
		$this->assertEquals( 'POST', $this->request_args['method'] );

		$this->assertArrayHasKey( 'Authorization', $this->request_args['headers'] );
		$this->assertEquals( "Bearer $access_token", $this->request_args['headers']['Authorization'] );

		$this->assertEqualSetsWithIndex(
			array(
				'site_id'     => $site_id,
				'site_secret' => $site_secret,
				'session'     => $session,
				'event'       => $event,
			),
			json_decode( $this->request_args['body'], true )
		);

		$this->assertEqualSetsWithIndex( $expected_success_response, $response );
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
				$this->request_url  = $url;
				$this->request_args = $args;

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
			function ( $response, $parsed_args, $url ) use ( $request_url, $response_error ) {
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
