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
use Google\Site_Kit\Core\Authentication\Owner_ID;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;
use Google\Site_Kit_Dependencies\GuzzleHttp\Stream\Stream;

/**
 * @group Authentication
 */
class OAuth_ClientTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_get_client() {
		$oauth_client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$client       = $oauth_client->get_client();

		$this->assertInstanceOf( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client', $client );

		$retry = $client->getConfig( 'retry' );
		$this->assertEquals( $retry['retries'], 3 );
	}

	public function test_refresh_token() {
		$this->fake_site_connection();
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

		// Includes additional granted scopes when present.
		update_user_option( $user_id, OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, array( 'extra-scope' ) );

		$this->assertEqualSets(
			array( 'test-scope', 'extra-scope' ),
			$client->get_granted_scopes()
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
			$client->get_granted_additional_scopes()
		);
	}

	public function test_needs_reauthentication() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// False if user has no access token.
		$this->assertEmpty( $client->get_access_token() );
		$this->assertFalse( $client->needs_reauthentication() );

		$client->set_access_token( 'test-access-token', 3600 );

		// Needs authentication if scopes are required but not granted.
		$this->assertNotEmpty( $client->get_required_scopes() );
		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ) );
		$this->assertTrue( $client->needs_reauthentication() );

		// Does not need authentication if all required scopes are granted.
		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $client->get_required_scopes() );
		$this->assertFalse( $client->needs_reauthentication() );
	}

	public function test_get_unsatisfied_scopes() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$required_scopes    = array( 'test-scope-1', 'test-scope-2' );
		$granted_scopes     = array( 'test-scope-1' );
		$unsatisfied_scopes = array_diff( $required_scopes, $granted_scopes );

		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $granted_scopes );
		$this->assertEqualSets( $unsatisfied_scopes, $client->get_unsatisfied_scopes( $required_scopes ) );

		update_user_option( $user_id, OAuth_Client::OPTION_AUTH_SCOPES, $required_scopes );
		$this->assertEmpty( $client->get_unsatisfied_scopes( $required_scopes ) );
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

		$this->assertNotContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ) );

		$client->set_granted_scopes( array( 'test-scope' ) );

		$this->assertContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ) );
		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, $user_id ) );

		// It saves any additional (non-required) scopes into its respective user option.
		$client->set_granted_scopes( array( 'test-scope', 'extra-scope' ) );

		$this->assertContains( 'test-scope', (array) get_user_option( OAuth_Client::OPTION_AUTH_SCOPES, $user_id ) );
		$this->assertContains( 'extra-scope', (array) get_user_option( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, $user_id ) );
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
		$fake_credentials = $this->fake_site_connection();
		$user_id          = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$base_scopes        = $client->get_required_scopes();
		$post_auth_redirect = 'http://example.com/test/redirect/url';
		$authentication_url = $client->get_authentication_url( $post_auth_redirect );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/auth?', $authentication_url );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );

		// Verify that the user locale is included in the URL.
		$this->assertStringEndsWith( '&hl=en_US', $authentication_url );

		/**
		 * The redirect URL passed to get_authentication_url is used locally, and the redirect URI here is always the same.
		 * @see \Google\Site_Kit\Core\Authentication\Authentication::handle_oauth
		 */
		$this->assertEquals( add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ), $params['redirect_uri'] );
		$this->assertEquals( $fake_credentials['client_id'], $params['client_id'] );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			$base_scopes
		);

		// Does not include any saved additional scopes.
		$saved_extra_scopes = array( 'http://example.com/saved/extra-scope' );
		update_user_option( $user_id, OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, $saved_extra_scopes );
		$authentication_url = $client->get_authentication_url( $post_auth_redirect );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/auth?', $authentication_url );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			$base_scopes
		);

		// Accepts additional scopes via second parameter to include in the request.
		$extra_scopes       = array(
			'http://example.com/foo/bar',
			'http://example.com/bar/baz',
		);
		$authentication_url = $client->get_authentication_url( $post_auth_redirect, $extra_scopes );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/auth?', $authentication_url );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			array_merge( $base_scopes, $extra_scopes )
		);
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

		$authentication_url = $client->get_authentication_url( '', $additional_scopes );

		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		$requested_scopes = explode( ' ', $params['scope'] );
		$this->assertNotContains( 'gttp://example.com/test/scope/a', $requested_scopes );
		$this->assertNotContains( 'gttps://example.com/test/scope/b', $requested_scopes );
		$this->assertContains( 'http://example.com/test/scope/a', $requested_scopes );
		$this->assertContains( 'https://example.com/test/scope/b', $requested_scopes );
		$this->assertContains( 'openid', $requested_scopes );
		$this->assertContains( 'http', $requested_scopes );
		$this->assertContains( 'example.com/test/scope/a', $requested_scopes );
		$this->assertContains( 'https://example.com/test/scope/c', $requested_scopes );
	}

	public function test_authorize_user() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context );

		// If GET[error] is set, it redirects to admin URL.
		$client        = new OAuth_Client( $context, null, $user_options );
		$_GET['error'] = 'callback_error';
		$this->fake_site_connection(); // required by get_authentication_url

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
		$this->fake_site_connection();
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

	public function test_should_update_owner_id() {
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$owner_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$client  = new OAuth_Client( $context, $options );

		$class  = new \ReflectionClass( OAuth_Client::class );
		$method = $class->getMethod( 'should_update_owner_id' );
		$method->setAccessible( true );

		$should_update_owner_id = function ( ...$args ) use ( $method, $client ) {
			return $method->invoke( $client, $args );
		};

		$map_meta_cap = function( $user_id ) {
			return function( $caps, $cap, $uid ) use ( $user_id ) {
				if ( Permissions::MANAGE_OPTIONS === $cap && $uid === $user_id ) {
					return array( 'manage_options' );
				}
				return $caps;
			};
		};

		// Should return FALSE when user is already an owner.
		$options->set( Owner_ID::OPTION, $owner_id );
		$this->assertFalse( $should_update_owner_id( $owner_id ) );

		// Should return FALSE when the current owner is set and has MANAGE_OPTIONS permissions.
		$map_owner_id_meta_cap = $map_meta_cap( $owner_id );
		add_filter( 'map_meta_cap', $map_owner_id_meta_cap, 99, 3 );
		$this->assertFalse( $should_update_owner_id( $admin_id ) );
		remove_filter( 'map_meta_cap', $map_owner_id_meta_cap, 99, 3 );

		// Should return FALSE when passed user has no MANAGE_OPTIONS permssions.
		$this->assertFalse( $should_update_owner_id( $admin_id ) );

		// Should return TRUE when the current owner has appropriate permissions and not equals to provided user who has appropriate permissions too.
		$map_admin_id_meta_cap = $map_meta_cap( $admin_id );
		add_filter( 'map_meta_cap', $map_admin_id_meta_cap, 99, 3 );
		$this->assertFalse( $should_update_owner_id( $admin_id ) );
	}

	public function test_refresh_profile_data() {
		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_id_a = $this->factory()->user->create();
		wp_set_current_user( $user_id_a );
		$user_options = new User_Options( $context, $user_id_a );
		$profile      = new Profile( $user_options );
		// Need to instantiate after current user is set so that User_Options inherits.
		$client = new OAuth_Client( $context, null, $user_options, null, null, $profile );

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
				// Return a failing response
				return new Response( 500 );
			}
		);
		$google_client_mock->setHttpClient( $http_client );
		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )->willReturn( array( 'access_token' => 'test-access-token' ) );
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		$this->assertFalse( $profile->has() );
		$this->assertFalse(
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_a ) )
		);

		$current_time = time();
		$client->refresh_profile_data( MINUTE_IN_SECONDS );

		$this->assertFalse( $profile->has() );
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_a ) )
		);

		// A successful refresh call should clear any scheduled refresh event for the same user.
		$user_id_b = $this->factory()->user->create();
		$user_options->switch_user( $user_id_b );
		$client->refresh_profile_data( MINUTE_IN_SECONDS );
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_b ) )
		);
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
		// Call refresh again for the second user, which will succeed.
		$client->refresh_profile_data( MINUTE_IN_SECONDS );
		// The scheduled event for the second user should now be cleared.
		$this->assertFalse(
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_b ) )
		);
		$this->assertTrue( $profile->has() );
		// The scheduled event for the first user should still be present.
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( OAuth_Client::CRON_REFRESH_PROFILE_DATA, array( $user_id_a ) )
		);
	}

	public function test_using_proxy() {
		$this->setExpectedDeprecated( OAuth_Client::class . '::using_proxy' );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$client  = new OAuth_Client( $context );

		// Use proxy by default.
		$this->assertTrue( $client->using_proxy() );

		// Don't use proxy when regular OAuth client ID is used.
		$this->fake_site_connection();
		$this->assertFalse( $client->using_proxy() );

		// Use proxy when proxy site ID is used.
		$this->fake_proxy_site_connection();
		$this->assertTrue( $client->using_proxy() );
	}

	public function test_get_proxy_setup_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// If no site ID, pass site registration args.
		$client = new OAuth_Client( $context );
		$url    = $client->get_proxy_setup_url();
		$this->assertContains( 'name=', $url );
		$this->assertContains( 'url=', $url );
		$this->assertContains( 'scope=', $url );
		$this->assertContains( 'nonce=', $url );
		$this->assertContains( 'redirect_uri=', $url );
		$this->assertContains( 'action_uri=', $url );
		$this->assertContains( 'return_uri=', $url );
		$this->assertContains( 'analytics_redirect_uri=', $url );
		$this->assertContains( 'user_roles=', $url );
		$this->assertContains( 'application_name=', $url );
		$this->assertContains( 'hl=', $url );
		$this->assertNotContains( 'site_id=', $url );

		// Otherwise, pass site ID and given temporary access code.
		$fake_credentials = $this->fake_proxy_site_connection();
		$client           = new OAuth_Client( $context );
		$url              = $client->get_proxy_setup_url( 'temp-code' );
		$this->assertContains( 'site_id=' . $fake_credentials['client_id'], $url );
		$this->assertContains( 'code=temp-code', $url );
		$this->assertContains( 'scope=', $url );
		$this->assertContains( 'nonce=', $url );
		$this->assertContains( 'user_roles=', $url );
		$this->assertContains( 'application_name=', $url );
		$this->assertNotContains( '&name=', $url );
		$this->assertNotContains( 'url=', $url );
		$this->assertNotContains( 'redirect_uri=', $url );
		$this->assertNotContains( 'action_uri=', $url );
		$this->assertNotContains( 'return_uri=', $url );
		$this->assertNotContains( 'analytics_redirect_uri=', $url );
	}

	public function test_get_proxy_permissions_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// If no access token, this does not work.
		$client = new OAuth_Client( $context );
		$url    = $client->get_proxy_permissions_url();
		$this->assertEmpty( $url );

		// The URL has to include the access token.
		$client = new OAuth_Client( $context );
		$client->set_access_token( 'test-access-token', 3600 );
		$url = $client->get_proxy_permissions_url();
		$this->assertContains( 'token=test-access-token', $url );
		$this->assertContains( 'application_name=', $url );
		$this->assertContains( 'hl=', $url );

		// If there is a site ID, it should also include that.
		$fake_credentials = $this->fake_proxy_site_connection();
		$client           = new OAuth_Client( $context );
		$client->set_access_token( 'test-access-token', 3600 );
		$url = $client->get_proxy_permissions_url();
		$this->assertContains( 'token=test-access-token', $url );
		$this->assertContains( 'site_id=' . $fake_credentials['client_id'], $url );
		$this->assertContains( 'application_name=', $url );
		$this->assertContains( 'hl=', $url );
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
