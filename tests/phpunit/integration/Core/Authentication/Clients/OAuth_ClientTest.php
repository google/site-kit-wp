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
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class OAuth_ClientTest extends TestCase {

	const SITE_ID   = '12345678.apps.sitekit.withgoogle.com';
	const CLIENT_ID = 'test-client-id';

	public function test_get_client() {
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf( 'Google_Client', $client->get_client() );
	}

	public function test_refresh_token() {
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

		// Google client must be initialized first
		$this->assertEquals( 'refresh_token_not_exist', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		$client->get_client();
		$client->refresh_token();

		// At this point an error is triggered internally due to undefined indexes on $authentication_token
		// and the saved error code is 'invalid_grant' by default.
		$this->assertEquals( 'invalid_grant', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );
	}

	public function test_revoke_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		// Initialize Google Client
		$client->get_client();
		// Nothing to assert here other than to make sure no errors are raised or exceptions thrown.
		$client->revoke_token();
	}

	public function test_get_required_scopes() {
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->assertArraySubset(
			array(
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email',
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

		$current_time_before = current_time( 'timestamp', true );
		$this->assertTrue( $client->set_access_token( 'test-access-token', 123 ) );
		$current_time_after = current_time( 'timestamp', true );
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
		 * Requires credentials for redirect_uri to be set on the Google_Client.
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
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// If GET[code] is not set, it redirects to auth URL.
		$client = new OAuth_Client( $context );
		$this->fake_authentication(); // required by get_authentication_url
		$auth_url = $client->get_authentication_url();

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertEquals( $auth_url, $redirect->get_location() );
		}

		// GET[code] is set and no credentials
		$_GET['code'] = 'truthy';
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
		$credentials_mock = $this->getMock( 'MockClass', array( 'has' ) );
		$credentials_mock->method( 'has' )->willReturn( true );
		$this->force_set_property( $client, 'credentials', $credentials_mock );
		// If all goes smooth, we expect to be redirected to $success_redirect
		$success_redirect = admin_url( 'success-redirect' );
		$client->get_authentication_url( $success_redirect );
		// No other way around this but to mock the Google_Client
		$google_client_mock = $this->getMock( 'Google_Client', array( 'fetchAccessTokenWithAuthCode' ) );
		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )->willReturn( array( 'access_token' => 'test-access-token' ) );
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertStringStartsWith( "$success_redirect?", $redirect->get_location() );
			$this->assertContains( 'notification=authentication_success', $redirect->get_location() );
		}
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
		$client  = new OAuth_Client( $context );
		$url = $client->get_proxy_setup_url();
		$this->assertTrue( (bool) strpos( $url, 'name=' ) );
		$this->assertTrue( (bool) strpos( $url, 'url=' ) );
		$this->assertTrue( (bool) strpos( $url, 'rest_root=wp-json' ) );
		$this->assertTrue( (bool) strpos( $url, 'admin_root=wp-admin' ) );

		// Otherwise, pass site ID and given temporary access code.
		$this->fake_proxy_authentication();
		$client  = new OAuth_Client( $context );
		$url = $client->get_proxy_setup_url( 'temp-code' );
		$this->assertTrue( (bool) strpos( $url, 'site_id=' . self::SITE_ID ) );
		$this->assertTrue( (bool) strpos( $url, 'code=temp-code' ) );
	}

	public function test_get_proxy_permissions_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// If no access token, this does not work.
		$client  = new OAuth_Client( $context );
		$url = $client->get_proxy_permissions_url();
		$this->assertEmpty( $url );

		// The URL has to include the access token.
		$encrypted_user_options = $this->force_get_property( $client, 'encrypted_user_options' );
		$encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'test-access-token' );
		$url = $client->get_proxy_permissions_url();
		$this->assertTrue( (bool) strpos( $url, 'token=test-access-token' ) );

		// If there is a site ID, it should also include that.
		$this->fake_proxy_authentication();
		$client  = new OAuth_Client( $context );
		$url = $client->get_proxy_permissions_url();
		$this->assertTrue( (bool) strpos( $url, 'token=test-access-token' ) );
		$this->assertTrue( (bool) strpos( $url, 'site_id=' . self::SITE_ID ) );
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
		add_filter( 'googlesitekit_oauth_secret', function () {
			return json_encode( array(
				'web' => array(
					'client_id'     => self::CLIENT_ID,
					'client_secret' => 'test-client-secret',
				),
			) );
		} );
	}

	protected function fake_proxy_authentication() {
		add_filter( 'googlesitekit_oauth_secret', function () {
			return json_encode( array(
				'web' => array(
					'client_id'     => self::SITE_ID,
					'client_secret' => 'test-client-secret',
				),
			) );
		} );
	}
}
