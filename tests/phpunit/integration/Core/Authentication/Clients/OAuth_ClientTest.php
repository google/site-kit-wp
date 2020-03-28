<?php
/**
 * OAuth_ClientTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication\Clients
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication\Clients;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;
use Google\Site_Kit_Dependencies\GuzzleHttp\Stream\Stream;

/**
 * @group Authentication
 */
class OAuth_ClientTest extends TestCase {

	const SITE_ID   = '12345678.apps.sitekit.withgoogle.com';
	const CLIENT_ID = 'test-client-id';

	public function test_get_client() {
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client', $client->get_client() );
	}

	public function test_refresh_token() {
		$this->fake_authentication();
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Make sure we're starting with a clean slate
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		$client->refresh_token();

		// Make sure we're getting the expected error
		$this->assertEquals( 'refresh_token_not_exist', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		$this->assertTrue( $client->set_refresh_token( 'test-refresh-token' ) );

		$client->refresh_token();

		// If the request completely fails (cURL error), ignore that.
		$http_error = (string) get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id );
		if ( 0 !== strpos( $http_error, 'cURL error' ) ) {
			$this->assertEquals( 'refresh_token_not_exist', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );
		}

		$client->get_client()->setHttpClient( new FakeHttpClient() );
		$client->refresh_token();

		// There is no actual response, so attempting to decode JSON fails.
		$this->assertEquals( 'Invalid JSON response', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );
	}

	public function test_revoke_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$client       = new OAuth_Client( $context, null, $user_options );

		foreach ( $this->get_user_credential_keys() as $key ) {
			$user_options->set( $key, "test-$key-value" );
		}

		// Initialize Google Client
		$client->get_client();
		// Nothing to assert here other than to make sure no errors are raised or exceptions thrown.
		$client->revoke_token();

		foreach ( $this->get_user_credential_keys() as $key ) {
			$this->assertFalse( $user_options->get( $key ) );
		}
	}

	public function test_get_required_scopes() {
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email',
				'openid',
			),
			$client->get_required_scopes()
		);
	}

	public function test_get_granted_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$granted_scopes = array( 'test-scope' );
		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $granted_scopes );

		$this->assertEquals( $granted_scopes, $client->get_granted_scopes() );
	}

	public function test_set_granted_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertNotContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ) );

		$this->assertTrue( $client->set_granted_scopes( array( 'test-scope' ) ) );

		$this->assertContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ) );
	}

	public function test_get_access_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client                 = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_user_options = $this->force_get_property( $client, 'encrypted_user_options' );

		$this->assertFalse( $client->get_access_token() );

		$encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'test-access-token' );
		$this->assertEquals( 'test-access-token', $client->get_access_token() );

		// Access token fetch from encrypted option is memoized
		$encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'test-access-token-changed' );
		$this->assertEquals( 'test-access-token', $client->get_access_token() );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertEquals( 'test-access-token-changed', $client->get_access_token() );
	}

	public function test_set_access_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( false, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $user_id ) );
		$this->assertEquals( false, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ) );

		$current_time_before = time();
		$this->assertTrue( $client->set_access_token( 'test-access-token', 123 ) );
		$current_time_after = time();
		$created_at         = get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $user_id );
		// Uses current GMT timestamp if not provided
		$this->assertGreaterThanOrEqual( $current_time_before, $created_at );
		$this->assertLessThanOrEqual( $current_time_after, $created_at );
		$this->assertEquals( 123, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ) );

		// Setting is memoized based on access token
		$this->assertTrue( $client->set_access_token( 'test-access-token', 456 ) );
		$this->assertEquals( 123, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ) );

		// Created at can be passed explicitly when setting
		$created_at = $current_time_before - HOUR_IN_SECONDS;
		$this->assertTrue( $client->set_access_token( 'new-test-access-token', 789, $created_at ) );
		$this->assertEquals( 789, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ) );
		$this->assertEquals( $created_at, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $user_id ) );
	}

	public function test_get_refresh_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client                 = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_user_options = $this->force_get_property( $client, 'encrypted_user_options' );

		$this->assertFalse( $client->get_refresh_token() );

		$encrypted_user_options->set( OAuth_Client::OPTION_REFRESH_TOKEN, 'test-refresh-token' );
		$this->assertEquals( 'test-refresh-token', $client->get_refresh_token() );

		// Refresh token fetch from encrypted option is memoized
		$encrypted_user_options->set( OAuth_Client::OPTION_REFRESH_TOKEN, 'test-refresh-token-changed' );
		$this->assertEquals( 'test-refresh-token', $client->get_refresh_token() );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertEquals( 'test-refresh-token-changed', $client->get_refresh_token() );
	}

	public function test_set_refresh_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client                 = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_user_options = $this->force_get_property( $client, 'encrypted_user_options' );

		$this->assertFalse( $encrypted_user_options->get( OAuth_Client::OPTION_REFRESH_TOKEN ) );
		$this->assertTrue( $client->set_refresh_token( 'test-refresh-token' ) );
		$this->assertEquals( 'test-refresh-token', $encrypted_user_options->get( OAuth_Client::OPTION_REFRESH_TOKEN ) );
	}

	public function test_get_authentication_url() {
		/**
		 * Requires credentials for redirect_uri to be set on the Google_Site_Kit_Client.
		 * @see \Google\Site_Kit\Core\Authentication\Clients\OAuth_Client::get_client
		 */
		$this->fake_authentication();
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$post_auth_redirect = 'http://example.com/test/redirect/url';
		$authentication_url = $client->get_authentication_url( $post_auth_redirect );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/auth?', $authentication_url );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		/**
		 * The redirect URL passed to get_authentication_url is used locally, and the redirect URI here is always the same.
		 * @see \Google\Site_Kit\Core\Authentication\Authentication::handle_oauth
		 */
		$this->assertEquals( add_query_arg( 'oauth2callback', 1, home_url() ), $params['redirect_uri'] );
		$this->assertEquals( self::CLIENT_ID, $params['client_id'] );
	}

	public function test_authorize_user() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );

		// If GET[error] is set, it redirects to admin URL.
		$client        = new OAuth_Client( $context, null, $user_options );
		$_GET['error'] = 'callback_error';
		$this->fake_authentication(); // required by get_authentication_url

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertEquals( 'callback_error', $user_options->get( OAuth_Client::OPTION_ERROR_CODE ) );
			$this->assertEquals( admin_url(), $redirect->get_location() );
		}

		// If no credentials.
		unset( $_GET['error'] );
		remove_all_filters( 'googlesitekit_oauth_secret' );
		$client = new OAuth_Client( $context );

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertEquals( admin_url(), $redirect->get_location() );
		}

		$this->assertEquals( 'oauth_credentials_not_exist', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		$_GET['code'] = 'test-code';
		$this->fake_authentication();
		// If all goes smooth, we expect to be redirected to $success_redirect
		$success_redirect = admin_url( 'success-redirect' );
		$client->get_authentication_url( $success_redirect );
		// No other way around this but to mock the Google_Site_Kit_Client
		$google_client_mock = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'fetchAccessTokenWithAuthCode' ) )->getMock();
		$http_client        = new FakeHttpClient();
		$http_client->set_request_handler(
			function ( Request $request ) {
				$url = parse_url( $request->getUrl() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new Response( 200 );
				}

				return new Response(
					200,
					array(),
					Stream::factory(
						json_encode(
							array(
								'emailAddresses' => array(
									array( 'value' => 'fresh@foo.com' ),
								),
								'photos'         => array(
									array( 'url' => 'https://example.com/fresh.jpg' ),
								),
							)
						)
					)
				);
			}
		);
		$google_client_mock->setHttpClient( $http_client );
		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )->willReturn( array( 'access_token' => 'test-access-token' ) );
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		$this->assertFalse( $user_options->get( Profile::OPTION ) );

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertStringStartsWith( "$success_redirect?", $redirect->get_location() );
			$this->assertContains( 'notification=authentication_success', $redirect->get_location() );
		}

		$profile = $user_options->get( Profile::OPTION );
		$this->assertEquals( 'fresh@foo.com', $profile['email'] );
		$this->assertEquals( 'https://example.com/fresh.jpg', $profile['photo'] );
	}

	public function test_using_proxy() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// Use proxy by default.
		$client = new OAuth_Client( $context );
		$this->assertTrue( $client->using_proxy() );

		// Don't use proxy when regular OAuth client ID is used.
		$this->fake_authentication();
		$client = new OAuth_Client( $context );
		$this->assertFalse( $client->using_proxy() );

		// Use proxy when proxy site ID is used.
		$this->fake_proxy_authentication();
		$client = new OAuth_Client( $context );
		$this->assertTrue( $client->using_proxy() );
	}

	public function test_get_proxy_setup_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// If no site ID, pass site registration args.
		$client = new OAuth_Client( $context );
		$url    = $client->get_proxy_setup_url();
		$this->assertContains( 'name=', $url );
		$this->assertContains( 'url=', $url );
		$this->assertContains( 'admin_root=', $url );
		$this->assertContains( 'scope=', $url );
		$this->assertContains( 'nonce=', $url );
		$this->assertContains( 'return_uri=', $url );
		$this->assertContains( 'action_uri=', $url );
		$this->assertNotContains( 'site_id=', $url );

		// Otherwise, pass site ID and given temporary access code.
		$this->fake_proxy_authentication();
		$client = new OAuth_Client( $context );
		$url    = $client->get_proxy_setup_url( 'temp-code' );
		$this->assertContains( 'site_id=' . self::SITE_ID, $url );
		$this->assertContains( 'code=temp-code', $url );
		$this->assertContains( 'scope=', $url );
		$this->assertContains( 'nonce=', $url );
		$this->assertNotContains( 'name=', $url );
		$this->assertNotContains( 'url=', $url );
		$this->assertNotContains( 'admin_root=', $url );
		$this->assertNotContains( 'return_uri=', $url );
		$this->assertNotContains( 'action_uri=', $url );
	}

	public function test_get_proxy_permissions_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// If no access token, this does not work.
		$client = new OAuth_Client( $context );
		$url    = $client->get_proxy_permissions_url();
		$this->assertEmpty( $url );

		// The URL has to include the access token.
		$client = new OAuth_Client( $context );
		$client->set_access_token( 'test-access-token', 3600 );
		$url = $client->get_proxy_permissions_url();
		$this->assertContains( 'token=test-access-token', $url );

		// If there is a site ID, it should also include that.
		$this->fake_proxy_authentication();
		$client = new OAuth_Client( $context );
		$client->set_access_token( 'test-access-token', 3600 );
		$url = $client->get_proxy_permissions_url();
		$this->assertContains( 'token=test-access-token', $url );
		$this->assertContains( 'site_id=' . self::SITE_ID, $url );
	}

	public function test_get_error_message_unknown() {
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertContains( 'Unknown Error (code: unknown_code)', $client->get_error_message( 'unknown_code' ) );
		$this->assertContains( 'Unknown Error (code: )', $client->get_error_message( '' ) );
		$this->assertContains( 'Unknown Error (code: 123)', $client->get_error_message( 123 ) );
	}

	/**
	 * @dataProvider error_message_provider
	 */
	public function test_get_error_message( $error_code ) {
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$message = $client->get_error_message( $error_code );

		$this->assertRegExp( '/unable|invalid|failed/i', $message );
		$this->assertNotContains( 'Unknown Error', $message );
	}

	public function error_message_provider() {
		return array(
			array( 'oauth_credentials_not_exist' ),
			array( 'refresh_token_not_exist' ),
			array( 'cannot_log_in' ),
			array( 'invalid_grant' ),
			array( 'invalid_code' ),
			array( 'access_token_not_received' ),
		);
	}

	protected function fake_authentication() {
		add_filter(
			'googlesitekit_oauth_secret',
			function () {
				return json_encode(
					array(
						'web' => array(
							'client_id'     => self::CLIENT_ID,
							'client_secret' => 'test-client-secret',
						),
					)
				);
			}
		);
	}

	protected function fake_proxy_authentication() {
		add_filter(
			'googlesitekit_oauth_secret',
			function () {
				return json_encode(
					array(
						'web' => array(
							'client_id'     => self::SITE_ID,
							'client_secret' => 'test-client-secret',
						),
					)
				);
			}
		);
	}

	protected function get_user_credential_keys() {
		return array(
			OAuth_Client::OPTION_ACCESS_TOKEN,
			OAuth_Client::OPTION_ACCESS_TOKEN_CREATED,
			OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN,
			OAuth_Client::OPTION_AUTH_SCOPES,
			OAuth_Client::OPTION_ERROR_CODE,
			OAuth_Client::OPTION_REDIRECT_URL,
			OAuth_Client::OPTION_REFRESH_TOKEN,
		);
	}
}
