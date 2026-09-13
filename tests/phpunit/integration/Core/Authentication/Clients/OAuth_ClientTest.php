<?php
/**
 * OAuth_ClientTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication\Clients
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication\Clients;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Query;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Authentication
 */
class OAuth_ClientTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_refresh_token() {
		$this->fake_site_connection();
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$client       = new OAuth_Client( $context );
		$user_options = new User_Options( $context );

		// Make sure we're starting with a clean slate.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Refresh should start without a stored OAuth error.' );

		$client->refresh_token();

		// Make sure we're getting the expected error.
		$this->assertEquals( 'refresh_token_not_exist', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Refresh without refresh token should store expected error.' );

		$this->assertTrue(
			$client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			),
			'Refresh setup should store access and refresh tokens.'
		);

		delete_user_option( $user_id, OAuth_Client::OPTION_ERROR_CODE );

		// Set the request handler to return a response with a new access token.
		FakeHttp::fake_google_http_handler(
			$client->get_client(),
			function ( Request $request ) {
				if ( 0 !== strpos( $request->getUri(), 'https://oauth2.googleapis.com/token' ) ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				$body = Query::parse( $request->getBody() );

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode(
							array(
								'access_token' => 'new-test-access-token',
								'expires_in'   => 3599,
								'token_type'   => 'Bearer',
							)
						)
					)
				);
			}
		);

		$client->refresh_token();

		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Successful refresh should clear stored OAuth error.' );
		$this->assertEquals( 'new-test-access-token', $client->get_access_token(), 'Refresh should replace stored access token from token response.' );
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

		// Initialize Google Client.
		$client->get_client();
		// Nothing to assert here other than to make sure no errors are raised or exceptions thrown.
		$client->revoke_token();

		foreach ( $this->get_user_credential_keys() as $key ) {
			$this->assertFalse( $user_options->get( $key ), "Revoking token should clear user credential '$key'." );
		}
	}

	public function test_get_granted_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$granted_scopes = array( 'test-scope' );
		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $granted_scopes );

		$this->assertEquals( $granted_scopes, $client->get_granted_scopes(), 'Granted scopes should come from stored auth scopes.' );

		update_user_option( $user_id, OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, array( 'extra-scope' ) );

		$this->assertEqualSets(
			array( 'test-scope', 'extra-scope' ),
			$client->get_granted_scopes(),
			'Granted scopes should merge stored base and additional scopes.'
		);
	}

	public function test_get_granted_additional_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, array( 'test-scope' ) );
		update_user_option( $user_id, OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, array( 'extra-scope' ) );

		// Only returns additional scopes.

		$this->assertEqualSets(
			array( 'extra-scope' ),
			$client->get_granted_additional_scopes(),
			'Additional scope getter should omit stored base scopes.'
		);
	}

	public function test_needs_reauthentication() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEmpty( $client->get_token(), 'New user should not have OAuth token data.' );
		$this->assertFalse( $client->needs_reauthentication(), 'User without token should not require reauthentication.' );

		$client->set_token( array( 'access_token' => 'test-access-token' ) );

		$this->assertNotEmpty( $client->get_required_scopes(), 'Reauth check should have required scopes to compare.' );
		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ), 'Token-only user should not have granted scopes yet.' );
		$this->assertTrue( $client->needs_reauthentication(), 'Token-only user should need missing required scopes.' );

		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $client->get_required_scopes() );
		$this->assertFalse( $client->needs_reauthentication(), 'User with all required scopes should not need reauth.' );
	}

	public function test_get_unsatisfied_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$required_scopes    = array( 'test-scope-1', 'test-scope-2' );
		$granted_scopes     = array( 'test-scope-1' );
		$unsatisfied_scopes = array_diff( $required_scopes, $granted_scopes );

		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $granted_scopes );
		$this->assertEqualSets( $unsatisfied_scopes, $client->get_unsatisfied_scopes( $required_scopes ), 'Unsatisfied scopes should contain ungranted required scopes.' );

		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $required_scopes );
		$this->assertEmpty( $client->get_unsatisfied_scopes( $required_scopes ), 'Unsatisfied scopes should clear when all required scopes granted.' );
	}

	public function test_set_granted_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Register a custom list of required scopes for this test.
		add_filter(
			'googlesitekit_auth_scopes',
			function () {
				return array( 'test-scope' );
			}
		);

		$this->assertNotContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ), 'Scope storage should start without custom required scope.' );

		$client->set_granted_scopes( array( 'test-scope' ) );

		$this->assertContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ), 'Granted required scope should be stored as base auth scope.' );
		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, $user_id ), 'Required-only grant should not store additional scopes.' );

		$client->set_granted_scopes( array( 'test-scope', 'extra-scope' ) );

		$this->assertContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ), 'Required scope should remain in base auth scope storage.' );
		$this->assertContains( 'extra-scope', (array) get_user_option( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, $user_id ), 'Extra granted scope should be stored separately.' );
	}

	public function test_get_access_token() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$token  = $this->force_get_property( $client, 'token' );

		$this->assertFalse( $client->get_access_token(), 'Access token getter should return false without token data.' );

		$token->set( array( 'access_token' => 'test-access-token' ) );
		$this->assertEquals( 'test-access-token', $client->get_access_token(), 'Access token getter should read token storage.' );
	}

	public function test_set_access_token() {
		$this->setExpectedDeprecated( OAuth_Client::class . '::set_access_token' );

		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( false, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $user_id ), 'Access token should not have created metadata before storage.' );
		$this->assertEquals( false, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ), 'Access token should not have expiry metadata before storage.' );

		$current_time_before = time();
		$this->assertTrue( $client->set_access_token( 'test-access-token', 123 ), 'Client should report successful access token storage.' );
		$current_time_after = time();
		$created_at         = get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $user_id );

		$this->assertGreaterThanOrEqual( $current_time_before, $created_at, 'Access token created without an explicit timestamp should use current time.' );
		$this->assertLessThanOrEqual( $current_time_after, $created_at, 'Access token created without an explicit timestamp should use current time.' );
		$this->assertEquals( 123, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ), 'Stored token expiry should match provided value.' );

		// Created at can be passed explicitly when setting.
		$created_at = $current_time_before - HOUR_IN_SECONDS;
		$this->assertTrue( $client->set_access_token( 'new-test-access-token', 789, $created_at ), 'Client should report successful access token storage with explicit timestamp.' );
		$this->assertEquals( 789, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ), 'Stored token expiry should match provided value.' );
		$this->assertEquals( $created_at, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $user_id ), 'Stored token timestamp should match provided value.' );
	}

	public function test_get_refresh_token() {
		$this->setExpectedDeprecated( OAuth_Client::class . '::get_refresh_token' );

		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$token  = $this->force_get_property( $client, 'token' );

		$this->assertFalse( $client->get_refresh_token(), 'Refresh token getter should return false without token data.' );

		$token->set(
			array(
				'access_token'  => 'test-access-token',
				'refresh_token' => 'test-refresh-token',
			)
		);
		$this->assertEquals( 'test-refresh-token', $client->get_refresh_token(), 'Refresh token getter should read token storage.' );
	}

	public function test_set_refresh_token() {
		$this->setExpectedDeprecated( OAuth_Client::class . '::set_refresh_token' );

		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$token  = $this->force_get_property( $client, 'token' );

		$token->set( array( 'access_token' => 'test-access-token' ) );
		$this->assertTrue( $client->set_refresh_token( 'test-refresh-token' ), 'Client should report successful refresh token storage.' );
		$token_data = $token->get();
		$this->assertArrayHasKey( 'refresh_token', $token_data, 'Token storage should gain refresh token field.' );
		$this->assertEquals( 'test-refresh-token', $token_data['refresh_token'], 'Stored refresh token should match provided value.' );
	}

	public function test_get_authentication_url() {
		/**
		 * Requires credentials for redirect_uri to be set on the Google_Site_Kit_Client.
		 * @see \Google\Site_Kit\Core\Authentication\Clients\OAuth_Client::get_client
		 */
		list( $client_id ) = $this->fake_site_connection();
		$user_id           = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );
		$client       = new OAuth_Client( $context, null, $user_options );

		$base_scopes              = $client->get_required_scopes();
		$post_auth_redirect       = 'http://example.com/test/redirect/url';
		$post_auth_error_redirect = 'http://example.com/test/redirect/error/url';
		$authentication_url       = $client->get_authentication_url( $post_auth_redirect, $post_auth_error_redirect );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/v2/auth?', $authentication_url, 'Authentication URL should target Google OAuth endpoint.' );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );

		// Verify that the user locale is included in the URL.
		$this->assertArrayHasKey( 'hl', $params, 'Authentication request should include locale parameter.' );
		$this->assertEquals( 'en_US', $params['hl'], 'Authentication request should use current user locale.' );

		/**
		 * The redirect URL passed to get_authentication_url is used locally, and the redirect URI here is always the same.
		 * @see \Google\Site_Kit\Core\Authentication\Authentication::handle_oauth
		 */
		$this->assertEquals( add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ), $params['redirect_uri'], 'Authentication request should use fixed OAuth callback URI.' );
		$this->assertEquals( $client_id, $params['client_id'], 'Authentication request should use connected client ID.' );
		$this->assertNotEmpty( $params['state'], 'Authentication request should include an OAuth state parameter.' );
		$this->assertEquals( $user_options->get( OAuth_Client::OPTION_OAUTH_STATE ), $params['state'], 'Authentication state should match the stored state.' );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			$base_scopes,
			'Authentication request should include required base scopes.'
		);

		// Does not include any saved additional scopes.
		$saved_extra_scopes = array( 'http://example.com/saved/extra-scope' );
		update_user_option( $user_id, OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, $saved_extra_scopes );
		$authentication_url = $client->get_authentication_url( $post_auth_redirect, $post_auth_error_redirect );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/v2/auth?', $authentication_url, 'Authentication URL should stay on Google with saved scopes.' );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			$base_scopes,
			'Authentication request should ignore saved additional scopes.'
		);

		// Accepts additional scopes via second parameter to include in the request.
		$extra_scopes       = array(
			'http://example.com/foo/bar',
			'http://example.com/bar/baz',
		);
		$authentication_url = $client->get_authentication_url( $post_auth_redirect, $post_auth_error_redirect, $extra_scopes );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/v2/auth?', $authentication_url, 'Authentication URL should stay on Google with extra scopes.' );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			array_merge( $base_scopes, $extra_scopes ),
			'Authentication request should include provided extra scopes.'
		);

		// Verify the notification query parameter has been added to the redirect URL.
		$this->assertEquals( add_query_arg( 'notification', 'authentication_success', $post_auth_redirect ), $user_options->get( OAuth_Client::OPTION_REDIRECT_URL ), 'Post-auth redirect should be stored with success notice.' );

		// Verify the error redirect is saved.
		$this->assertEquals( $post_auth_error_redirect, $user_options->get( OAuth_Client::OPTION_ERROR_REDIRECT_URL ), 'Post-auth error redirect should be stored unchanged.' );
	}

	public function test_get_authentication_url__with_additional_scopes() {
		$this->fake_site_connection();
		$client            = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$additional_scopes = array(
			'gttp://example.com/test/scope/a',
			'gttps://example.com/test/scope/b',
			'openid',
			'http',
			'example.com/test/scope/a',
			'https://example.com/test/scope/c',
		);

		$authentication_url = $client->get_authentication_url( '', '', $additional_scopes );

		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		$requested_scopes = explode( ' ', $params['scope'] );
		$this->assertNotContains( 'gttp://example.com/test/scope/a', $requested_scopes, 'Authentication scopes should reject invalid gttp scheme.' );
		$this->assertNotContains( 'gttps://example.com/test/scope/b', $requested_scopes, 'Authentication scopes should reject invalid gttps scheme.' );
		$this->assertContains( 'http://example.com/test/scope/a', $requested_scopes, 'Authentication scopes should normalize gttp scheme.' );
		$this->assertContains( 'https://example.com/test/scope/b', $requested_scopes, 'Authentication scopes should normalize gttps scheme.' );
		$this->assertContains( 'openid', $requested_scopes, 'Authentication scopes should preserve OpenID scope.' );
		$this->assertContains( 'http', $requested_scopes, 'Authentication scopes should preserve plain http scope.' );
		$this->assertContains( 'example.com/test/scope/a', $requested_scopes, 'Authentication scopes should preserve host-only scope.' );
		$this->assertContains( 'https://example.com/test/scope/c', $requested_scopes, 'Authentication scopes should preserve valid https scope.' );
	}

	public function test_get_authentication_url__with_notification() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$this->fake_site_connection();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );
		$client       = new OAuth_Client( $context, null, $user_options );

		// Pass in a redirect URL with a notification query parameter.
		$post_auth_redirect = 'http://example.com/test/redirect/url?notification=some_notification_value';
		$client->get_authentication_url( $post_auth_redirect );

		// Verify the redirect URL is preserved, including the original notification query parameter.
		$this->assertEquals( $post_auth_redirect, $user_options->get( OAuth_Client::OPTION_REDIRECT_URL ), 'Auth URL setup should preserve existing redirect notification.' );
	}

	public function test_authorize_user() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );

		// If GET[error] is set, it redirects to admin URL.
		$client        = new OAuth_Client( $context, null, $user_options );
		$_GET['error'] = 'callback_error';
		$this->fake_site_connection(); // required by get_authentication_url.

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertEquals( 'callback_error', $user_options->get( OAuth_Client::OPTION_ERROR_CODE ), 'OAuth callback error should be stored for display.' );
			$this->assertEquals( admin_url( 'admin.php?page=googlesitekit-splash' ), $redirect->get_location(), 'OAuth callback error should send user to splash page.' );
		}

		// If no credentials.
		unset( $_GET['error'] );
		remove_all_filters( 'googlesitekit_oauth_secret' );
		$client = new OAuth_Client( $context );

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertEquals( admin_url( 'admin.php?page=googlesitekit-splash' ), $redirect->get_location(), 'Authorization without credentials should redirect to splash.' );
		}

		$this->assertEquals( 'oauth_credentials_not_exist', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Authorization without credentials should store OAuth error.' );

		$_GET['code'] = 'test-code';
		$this->fake_site_connection();
		// If all goes smooth, we expect to be redirected to $success_redirect.
		$success_redirect = admin_url( 'success-redirect' );
		$client->get_authentication_url( $success_redirect );
		$_GET['state'] = $user_options->get( OAuth_Client::OPTION_OAUTH_STATE );

		$this->mock_google_client( $client );

		$this->assertFalse( $user_options->get( Profile::OPTION ), 'Authorization should start without stored profile data.' );

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$this->assertStringStartsWith( "$success_redirect?", $redirect->get_location(), 'Successful authorization should use configured redirect.' );
			$this->assertStringContainsString( 'notification=authentication_success', $redirect->get_location(), 'Successful authorization should append success notice.' );
		}

		$profile = $user_options->get( Profile::OPTION );
		$this->assertEquals( 'fresh@foo.com', $profile['email'], 'Authorization should store People API email.' );
		$this->assertEquals( 'https://example.com/fresh.jpg', $profile['photo'], 'Authorization should store People API photo.' );
		$this->assertEquals( 'Dr Funkenstein', $profile['full_name'], 'Authorization should store People API display name.' );
		$this->assertFalse( $user_options->get( OAuth_Client::OPTION_OAUTH_STATE ), 'Successful authorization should clear stored OAuth state.' );
	}

	public function test_authorize_user__rejects_mismatched_oauth_state() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );
		$client       = new OAuth_Client( $context, null, $user_options );

		$this->fake_site_connection();
		$client->get_authentication_url( admin_url( 'success-redirect' ) );

		$_GET['code']  = 'test-code';
		$_GET['state'] = 'attacker-controlled-state';

		$google_client_mock = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'fetchAccessTokenWithAuthCode' ) )->getMock();

		$google_client_mock->expects( $this->never() )
			->method( 'fetchAccessTokenWithAuthCode' );

		$this->force_set_property( $client, 'google_client', $google_client_mock );

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals( 'oauth_state_mismatch', $user_options->get( OAuth_Client::OPTION_ERROR_CODE ), 'OAuth callback should reject mismatched state.' );
			$this->assertEquals( admin_url( 'admin.php?page=googlesitekit-splash' ), $redirect->get_location(), 'State mismatch should redirect to the OAuth error page.' );
		}

		$this->assertFalse( $user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN ), 'State mismatch should not store an access token.' );
	}

	public function test_authorize_user__with_show_search_console() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );
		$client       = new OAuth_Client( $context, null, $user_options );
		$this->fake_site_connection();

		// Add a notification query parameter to the redirect URL.
		$success_redirect = add_query_arg(
			array(
				'notification' => 'some_notification_value',
			),
			admin_url( 'success-redirect' )
		);

		$client->get_authentication_url( $success_redirect );

		$this->mock_google_client( $client );

		$_GET['searchConsoleSetupSuccess'] = '1';

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg(
					array(
						'searchConsoleSetupSuccess' => 'true',
					),
					$success_redirect
				),
				$redirect->get_location(),
				'Authorization should preserve Search Console setup success flag.'
			);
		}
	}

	public function test_authorize_user__with_redirect_url_notification() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );
		$client       = new OAuth_Client( $context, null, $user_options );
		$this->fake_site_connection();

		// Add a notification query parameter to the redirect URL.
		$success_redirect = add_query_arg( 'notification', 'some_notification_value', admin_url( 'success-redirect' ) );

		$client->get_authentication_url( $success_redirect );

		$this->mock_google_client( $client );

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			// Verify the redirect URL is preserved, including the original notification query parameter.
			$this->assertEquals( $success_redirect, $redirect->get_location(), 'Authorization should preserve configured notification URL.' );
		}
	}

	public function test_authorize_user__default_redirect_url_notification_initial_setup() {
		$this->enable_feature( 'setupFlowRefresh' );
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );
		$client       = new OAuth_Client( $context, null, $user_options );

		$this->fake_site_connection();
		$this->mock_google_client( $client );

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg( 'notification', 'initial_setup_success', admin_url( 'admin.php?page=googlesitekit-splash' ) ),
				$redirect->get_location(),
				'Initial setup authorization should use setup success notice.'
			);
		}
	}

	public function test_authorize_user__default_redirect_url_notification_existing_user() {
		$this->enable_feature( 'setupFlowRefresh' );
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options    = new User_Options( $context );
		$client          = new OAuth_Client( $context, null, $user_options );
		$dismissed_items = new Dismissed_Items( $user_options );
		$dismissed_items->add( 'welcome-modal-gathering-data' );

		$this->fake_site_connection();
		$this->mock_google_client( $client );

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg( 'notification', 'authentication_success', admin_url( 'admin.php?page=googlesitekit-splash' ) ),
				$redirect->get_location(),
				'Existing user authorization should use auth success notice.'
			);
		}
	}

	public function test_authorize_user__transient_storage_prevents_duplicate_setups() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );
		$transients   = new Transients( $context );

		// Set up test data.
		$this->fake_site_connection();
		$_GET['code'] = 'test-code';
		$code_hash    = md5( 'test-code' );

		// FIRST AUTHORIZATION ATTEMPT.

		$client           = new OAuth_Client( $context, null, $user_options, null, null, null, null, $transients );
		$success_redirect = admin_url( 'success-redirect' );
		$client->get_authentication_url( $success_redirect );
		$_GET['state'] = $user_options->get( OAuth_Client::OPTION_OAUTH_STATE );

		// Mock Google client for token fetching.
		$google_client_mock = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'fetchAccessTokenWithAuthCode' ) )->getMock();

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode(
							array(
								'emailAddresses' => array(
									array( 'value' => 'test@example.com' ),
								),
								'photos'         => array(
									array( 'url' => 'https://example.com/photo.jpg' ),
								),
								'names'          => array(
									array( 'displayName' => 'Test User' ),
								),
							)
						)
					)
				);
			}
		);

		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )
							->willReturn(
								array(
									'access_token'  => 'test-access-token',
									'refresh_token' => 'test-refresh-token',
									'expires_in'    => 3600,
								)
							);
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		// First run should complete the auth flow and store the redirect URL in transients.
		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$redirect_url = $redirect->get_location();
			$this->assertStringStartsWith( "$success_redirect?", $redirect_url, 'First auth attempt should complete with success redirect.' );
		}

		// Verify the redirect URL was stored in transients.
		$stored_redirect = $transients->get( $code_hash );
		$this->assertEquals( $redirect_url, $stored_redirect, 'First auth redirect should be cached by auth code hash.' );

		// SECOND AUTHORIZATION ATTEMPT.

		// Create a new client instance to test the second attempt.
		$client2 = new OAuth_Client( $context, null, $user_options, null, null, null, null, $transients );
		$client2->get_authentication_url( $success_redirect );
		$_GET['state'] = $user_options->get( OAuth_Client::OPTION_OAUTH_STATE );

		// For the second client, we can verify it never calls `fetchAccessTokenWithAuthCode`
		// by setting up a mock that will fail the test if called.
		$google_client_mock2 = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'fetchAccessTokenWithAuthCode' ) )->getMock();

		$google_client_mock2->expects( $this->never() )
			->method( 'fetchAccessTokenWithAuthCode' );

		$this->force_set_property( $client2, 'google_client', $google_client_mock2 );

		// Now call `authorize_user` a second time.
		try {
			$client2->authorize_user();
			$this->fail( 'Expected to throw a RedirectException on second attempt!' );
		} catch ( RedirectException $redirect2 ) {
			// Verify the stored URL is used for the redirect.
			$this->assertEquals( $stored_redirect, $redirect2->get_location(), 'Duplicate auth attempt should reuse cached redirect.' );
		}
	}

	public function test_refresh_profile_data() {
		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_id_a = $this->factory()->user->create();
		wp_set_current_user( $user_id_a );
		$user_options = new User_Options( $context, $user_id_a );
		$profile      = new Profile( $user_options );
		// Need to instantiate after current user is set so that User_Options inherits.
		$client = new OAuth_Client( $context, null, $user_options, null, null, $profile );

		// No other way around this but to mock the Google_Site_Kit_Client.
		$google_client_mock = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
								->setMethods( array( 'fetchAccessTokenWithAuthCode' ) )->getMock();
		// Deferred request execution is false by default.
		$this->assertFalse( $google_client_mock->shouldDefer(), 'Profile refresh mock should start in immediate request mode.' );
		// This ensures that the defer is disabled in the method under test. (See #7356)
		// If not handled properly, the caller will not expect the response to be a Request and it will error.
		$google_client_mock->setDefer( true );

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new FulfilledPromise( new Response( 200 ) );
				}
				// Return a failing response.
				return new FulfilledPromise( new Response( 500 ) );
			}
		);

		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )->willReturn( array( 'access_token' => 'test-access-token' ) );
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		$this->assertFalse( $profile->has(), 'Profile refresh should start without stored profile.' );
		$this->assertFalse(
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_a ) ),
			'Profile refresh should start without scheduled retry.'
		);

		$current_time = time();
		$client->refresh_profile_data( MINUTE_IN_SECONDS );

		$this->assertFalse( $profile->has(), 'Failed People API response should not store profile.' );
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_a ) ),
			'Failed People API response should schedule retry.'
		);

		// A successful refresh call should clear any scheduled refresh event for the same user.
		$user_id_b = $this->factory()->user->create();
		$user_options->switch_user( $user_id_b );
		$client->refresh_profile_data( MINUTE_IN_SECONDS );
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_b ) ),
			'Failed second-user refresh should schedule user-specific retry.'
		);

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new FulfilledPromise( new Response( 200 ) );
				}
				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode(
							array(
								'emailAddresses' => array(
									array( 'value' => 'fresh@foo.com' ),
								),
								'photos'         => array(
									array( 'url' => 'https://example.com/fresh.jpg' ),
								),
								'names'          => array(
									array( 'displayName' => 'Dr Funkenstein' ),
								),
							)
						)
					)
				);
			}
		);

		// Call refresh again for the second user, which will succeed.
		$client->refresh_profile_data( MINUTE_IN_SECONDS );
		// The scheduled event for the second user should now be cleared.
		$this->assertFalse(
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_b ) ),
			'Successful profile refresh should clear retry for same user.'
		);
		$this->assertTrue( $profile->has(), 'Successful People API response should store profile.' );
		// The scheduled event for the first user should still be present.
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_a ) ),
			'Second-user success should not clear first user retry.'
		);

		// This ensures the previous defer was properly restored.
		$this->assertTrue( $google_client_mock->shouldDefer(), 'Profile refresh should restore previous defer mode.' );
	}

	public function test_get_proxy_permissions_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// If no access token, this does not work.
		$client = new OAuth_Client( $context );
		$url    = $client->get_proxy_permissions_url();
		$this->assertEmpty( $url, 'Proxy permissions URL should require access token.' );

		// The URL has to include the access token.
		$client = new OAuth_Client( $context );
		$client->set_token( array( 'access_token' => 'test-access-token' ) );
		$url = $client->get_proxy_permissions_url();
		$this->assertStringContainsString( 'token=test-access-token', $url, 'Proxy permissions URL should pass access token.' );
		$this->assertStringContainsString( 'application_name=', $url, 'Proxy permissions URL should identify application.' );
		$this->assertStringContainsString( 'hl=', $url, 'Proxy permissions URL should include user locale.' );

		// If there is a site ID, it should also include that.
		list( $site_id ) = $this->fake_proxy_site_connection();
		$client          = new OAuth_Client( $context );
		$client->set_token( array( 'access_token' => 'test-access-token' ) );
		$url = $client->get_proxy_permissions_url();
		$this->assertStringContainsString( 'token=test-access-token', $url, 'Proxy permissions URL with site should pass access token.' );
		$this->assertStringContainsString( 'site_id=' . $site_id, $url, 'Proxy permissions URL should pass connected site ID.' );
		$this->assertStringContainsString( 'application_name=', $url, 'Proxy permissions URL with site should identify app.' );
		$this->assertStringContainsString( 'hl=', $url, 'Proxy permissions URL with site should include locale.' );
	}

	private function mock_google_client( $client ) {
		$google_client_mock = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'fetchAccessTokenWithAuthCode' ) )->getMock();

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode(
							array(
								'emailAddresses' => array(
									array( 'value' => 'fresh@foo.com' ),
								),
								'photos'         => array(
									array( 'url' => 'https://example.com/fresh.jpg' ),
								),
								'names'          => array(
									array( 'displayName' => 'Dr Funkenstein' ),
								),
							)
						)
					)
				);
			}
		);

		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )->willReturn( array( 'access_token' => 'test-access-token' ) );

		$this->force_set_property( $client, 'google_client', $google_client_mock );
	}

	protected function get_user_credential_keys() {
		return array(
			OAuth_Client::OPTION_ACCESS_TOKEN,
			OAuth_Client::OPTION_ACCESS_TOKEN_CREATED,
			OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN,
			OAuth_Client::OPTION_AUTH_SCOPES,
			OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES,
			OAuth_Client::OPTION_REDIRECT_URL,
			OAuth_Client::OPTION_REFRESH_TOKEN,
		);
	}
}
