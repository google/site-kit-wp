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
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Activity_Metrics;
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Active_Consumers;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
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

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$client           = new OAuth_Client( $context );
		$user_options     = new User_Options( $context );
		$activity_metrics = new Activity_Metrics( $context, $user_options );
		$active_consumers = new Active_Consumers( $user_options );

		$activity_metrics->register();
		$active_consumers->set(
			array(
				1 => array( 'editor', 'author' ),
				2 => array( 'contributor', 'editor' ),
			)
		);

		// Make sure we're starting with a clean slate
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		$client->refresh_token();

		// Make sure we're getting the expected error
		$this->assertEquals( 'refresh_token_not_exist', get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		// Verify that the active consumers meta was not deleted.
		$this->assertEquals(
			array(
				1 => array( 'editor', 'author' ),
				2 => array( 'contributor', 'editor' ),
			),
			$active_consumers->get()
		);

		$this->assertTrue(
			$client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			)
		);

		delete_user_option( $user_id, OAuth_Client::OPTION_ERROR_CODE );

		// Set the request handler to return a response with a new access token.
		FakeHttp::fake_google_http_handler(
			$client->get_client(),
			function ( Request $request ) use ( $activity_metrics ) {
				if ( 0 !== strpos( $request->getUri(), 'https://oauth2.googleapis.com/token' ) ) {
					return new Response( 200 );
				}

				$body = Query::parse( $request->getBody() );

				// Ensure the token refresh request contains the set of active consumers.
				if ( $activity_metrics->get_for_refresh_token()['active_consumers'] !== $body['active_consumers'] ) {
					return new Response( 200 );
				}

				return new Response(
					200,
					array(),
					json_encode(
						array(
							'access_token' => 'new-test-access-token',
							'expires_in'   => 3599,
							'token_type'   => 'Bearer',
						)
					)
				);
			}
		);

		$client->refresh_token();

		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		// Verify that the active consumers meta was deleted.
		$this->assertEmpty( $active_consumers->get() );

		// Make sure the access token was updated for the user.
		$this->assertEquals( 'new-test-access-token', $client->get_access_token() );
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
		$this->assertEmpty( $client->get_token() );
		$this->assertFalse( $client->needs_reauthentication() );

		$client->set_token( array( 'access_token' => 'test-access-token' ) );

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
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$token  = $this->force_get_property( $client, 'token' );

		$this->assertFalse( $client->get_access_token() );

		$token->set( array( 'access_token' => 'test-access-token' ) );
		$this->assertEquals( 'test-access-token', $client->get_access_token() );
	}

	public function test_set_access_token() {
		$this->setExpectedDeprecated( OAuth_Client::class . '::set_access_token' );

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

		// Created at can be passed explicitly when setting
		$created_at = $current_time_before - HOUR_IN_SECONDS;
		$this->assertTrue( $client->set_access_token( 'new-test-access-token', 789, $created_at ) );
		$this->assertEquals( 789, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $user_id ) );
		$this->assertEquals( $created_at, get_user_option( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $user_id ) );
	}

	public function test_get_refresh_token() {
		$this->setExpectedDeprecated( OAuth_Client::class . '::get_refresh_token' );

		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$token  = $this->force_get_property( $client, 'token' );

		$this->assertFalse( $client->get_refresh_token() );

		$token->set(
			array(
				'access_token'  => 'test-access-token',
				'refresh_token' => 'test-refresh-token',
			)
		);
		$this->assertEquals( 'test-refresh-token', $client->get_refresh_token() );
	}

	public function test_set_refresh_token() {
		$this->setExpectedDeprecated( OAuth_Client::class . '::set_refresh_token' );

		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$token  = $this->force_get_property( $client, 'token' );

		$token->set( array( 'access_token' => 'test-access-token' ) );
		$this->assertTrue( $client->set_refresh_token( 'test-refresh-token' ) );
		$token_data = $token->get();
		$this->assertArrayHasKey( 'refresh_token', $token_data );
		$this->assertEquals( 'test-refresh-token', $token_data['refresh_token'] );
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

		$base_scopes        = $client->get_required_scopes();
		$post_auth_redirect = 'http://example.com/test/redirect/url';
		$authentication_url = $client->get_authentication_url( $post_auth_redirect );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/v2/auth?', $authentication_url );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );

		// Verify that the user locale is included in the URL.
		$this->assertArrayHasKey( 'hl', $params );
		$this->assertEquals( 'en_US', $params['hl'] );

		/**
		 * The redirect URL passed to get_authentication_url is used locally, and the redirect URI here is always the same.
		 * @see \Google\Site_Kit\Core\Authentication\Authentication::handle_oauth
		 */
		$this->assertEquals( add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ), $params['redirect_uri'] );
		$this->assertEquals( $client_id, $params['client_id'] );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			$base_scopes
		);

		// Does not include any saved additional scopes.
		$saved_extra_scopes = array( 'http://example.com/saved/extra-scope' );
		update_user_option( $user_id, OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, $saved_extra_scopes );
		$authentication_url = $client->get_authentication_url( $post_auth_redirect );
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/v2/auth?', $authentication_url );
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
		$this->assertStringStartsWith( 'https://accounts.google.com/o/oauth2/v2/auth?', $authentication_url );
		wp_parse_str( parse_url( $authentication_url, PHP_URL_QUERY ), $params );
		$this->assertEqualSets(
			explode( ' ', $params['scope'] ),
			array_merge( $base_scopes, $extra_scopes )
		);

		// Verify the notification query parameter has been added to the redirect URL.
		$this->assertEquals( add_query_arg( 'notification', 'authentication_success', $post_auth_redirect ), $user_options->get( OAuth_Client::OPTION_REDIRECT_URL ) );
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
		$this->assertEquals( $post_auth_redirect, $user_options->get( OAuth_Client::OPTION_REDIRECT_URL ) );
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
			$this->assertEquals( admin_url( 'admin.php?page=googlesitekit-splash' ), $redirect->get_location() );
		}

		// If no credentials.
		unset( $_GET['error'] );
		remove_all_filters( 'googlesitekit_oauth_secret' );
		$client = new OAuth_Client( $context );

		try {
			$client->authorize_user();
		} catch ( RedirectException $redirect ) {
			$this->assertEquals( admin_url( 'admin.php?page=googlesitekit-splash' ), $redirect->get_location() );
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

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new Response( 200 );
				}

				return new Response(
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
				);
			}
		);

		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )->willReturn( array( 'access_token' => 'test-access-token' ) );
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		$this->assertFalse( $user_options->get( Profile::OPTION ) );

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$this->assertStringStartsWith( "$success_redirect?", $redirect->get_location() );
			$this->assertStringContainsString( 'notification=authentication_success', $redirect->get_location() );
		}

		$profile = $user_options->get( Profile::OPTION );
		$this->assertEquals( 'fresh@foo.com', $profile['email'] );
		$this->assertEquals( 'https://example.com/fresh.jpg', $profile['photo'] );
		$this->assertEquals( 'Dr Funkenstein', $profile['full_name'] );
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
		// No other way around this but to mock the Google_Site_Kit_Client
		$google_client_mock = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'fetchAccessTokenWithAuthCode' ) )->getMock();

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new Response( 200 );
				}

				return new Response(
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
				);
			}
		);

		$google_client_mock->method( 'fetchAccessTokenWithAuthCode' )->willReturn( array( 'access_token' => 'test-access-token' ) );
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		try {
			$client->authorize_user();
			$this->fail( 'Expected to throw a RedirectException!' );
		} catch ( RedirectException $redirect ) {
			// Verify the redirect URL is preserved, including the original notification query parameter.
			$this->assertEquals( $success_redirect, $redirect->get_location() );
		}
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
		// Deferred request execution is false by default.
		$this->assertFalse( $google_client_mock->shouldDefer() );
		// This ensures that the defer is disabled in the method under test. (See #7356)
		// If not handled properly, the caller will not expect the response to be a Request and it will error.
		$google_client_mock->setDefer( true );

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new Response( 200 );
				}
				// Return a failing response
				return new Response( 500 );
			}
		);

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

		FakeHttp::fake_google_http_handler(
			$google_client_mock,
			function ( Request $request ) {
				$url = parse_url( $request->getUri() );
				if ( 'people.googleapis.com' !== $url['host'] || '/v1/people/me' !== $url['path'] ) {
					return new Response( 200 );
				}
				return new Response(
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

		// This ensures the previous defer was properly restored.
		$this->assertTrue( $google_client_mock->shouldDefer() );
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
		$client->set_token( array( 'access_token' => 'test-access-token' ) );
		$url = $client->get_proxy_permissions_url();
		$this->assertStringContainsString( 'token=test-access-token', $url );
		$this->assertStringContainsString( 'application_name=', $url );
		$this->assertStringContainsString( 'hl=', $url );

		// If there is a site ID, it should also include that.
		list( $site_id ) = $this->fake_proxy_site_connection();
		$client          = new OAuth_Client( $context );
		$client->set_token( array( 'access_token' => 'test-access-token' ) );
		$url = $client->get_proxy_permissions_url();
		$this->assertStringContainsString( 'token=test-access-token', $url );
		$this->assertStringContainsString( 'site_id=' . $site_id, $url );
		$this->assertStringContainsString( 'application_name=', $url );
		$this->assertStringContainsString( 'hl=', $url );
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
