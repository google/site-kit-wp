<?php
/**
 * AuthenticationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Notice;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Connected_Proxy_URL;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\PageSpeed_Insights\Settings as PageSpeed_Insights_Settings;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;
use WP_Screen;
use WPDieException;

/**
 * @group Authentication
 */
class AuthenticationTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_register() {
		remove_all_actions( 'init' );
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'admin_head' );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_filters( 'googlesitekit_admin_notices' );
		remove_all_filters( 'googlesitekit_authorize_user' );
		remove_all_filters( 'googlesitekit_setup_data' );
		remove_all_actions( OAuth_Client::CRON_REFRESH_PROFILE_DATA );

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$auth->register();

		// Authentication::handle_oauth is invoked on init but we cannot test it due to use of filter_input.
		$this->assertTrue( has_action( 'admin_init' ), 'Admin init action should be registered.' );
		$this->assertTrue( has_action( OAuth_Client::CRON_REFRESH_PROFILE_DATA ), 'Cron refresh profile data action should be registered.' );
		$this->assertTrue( has_action( 'googlesitekit_authorize_user' ), 'Authorize user action should be registered.' );

		$this->assertAdminDataExtended();
		$this->assertSetupDataExtended();

		$this->assertFalse( is_network_admin(), 'Should not be in network admin context.' );
		$admin_notices = apply_filters( 'googlesitekit_admin_notices', array() );
		$notice_slugs  = array_map(
			function ( $notice ) {
				return $notice instanceof Notice ? $notice->get_slug() : '';
			},
			$admin_notices
		);
		$this->assertEqualSets(
			array(
				'needs_reauthentication',
				'reconnect_after_url_mismatch',
			),
			array_filter( $notice_slugs ),
			'Admin notices should contain authentication-related notice slugs.'
		);
	}

	public function test_register__googlesitekit_user_data() {
		remove_all_filters( 'googlesitekit_user_data' );
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$auth         = new Authentication(
			$context,
			null,
			$user_options
		);
		$auth->register();
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ), 'User data filter should be registered.' );

		$user_data = apply_filters( 'googlesitekit_user_data', array() );
		$this->assertEqualSets(
			array(
				'connectURL',
				'initialVersion',
				'isUserInputCompleted',
				'verified',
				'hasMultipleAdmins',
			),
			array_keys( $user_data ),
			'User data should contain all required authentication keys.'
		);

		// When a profile is set, additional data is added.
		$email     = 'wapuu.wordpress@gmail.com';
		$photo     = 'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png';
		$full_name = 'Wapuu WordPress';
		$auth->profile()->set( compact( 'email', 'photo', 'full_name' ) );
		$user_data = apply_filters( 'googlesitekit_user_data', array() );
		$this->assertEqualSets(
			array(
				'connectURL',
				'initialVersion',
				'isUserInputCompleted',
				'verified',
				'user',
				'hasMultipleAdmins',
			),
			array_keys( $user_data ),
			'User data should contain all required authentication keys including user profile data.'
		);
		$this->assertEquals( $email, $user_data['user']['email'], 'User email should match the set profile email.' );
		$this->assertEquals( $photo, $user_data['user']['picture'], 'User picture should match the set profile photo.' );
		$this->assertEquals( $full_name, $user_data['user']['full_name'], 'User full name should match the set profile full name.' );
	}

	/**
	 * @dataProvider option_action_provider
	 * @param string $option
	 * @param string $initial_value
	 * @param string $new_value
	 */
	public function test_register_option_update_actions( $option, $initial_value, $new_value ) {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_actions( "update_option_$option" );
		remove_all_actions( 'shutdown' );
		$auth->register();

		delete_option( $option );
		add_option( $option, $initial_value );
		update_option( $option, $new_value );

		$this->assertTrue( has_action( 'shutdown' ), "Shutdown action should be registered for option: {$option}" );
	}

	public function test_register_set_initial_version_if_not_set() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$auth            = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$initial_version = $this->force_get_property( $auth, 'initial_version' );

		// Ensure no version is set yet.
		$initial_version->delete();
		remove_all_actions( 'googlesitekit_authorize_user' );
		remove_all_actions( 'googlesitekit_reauthorize_user' );
		$auth->register();

		$this->assertTrue( has_action( 'googlesitekit_authorize_user' ), 'Authorize user action should be registered for admin user.' );
		$this->assertTrue( has_action( 'googlesitekit_reauthorize_user' ), 'Reauthorize user action should be registered for admin user.' );

		// Response is not used here, so just pass an array.
		do_action( 'googlesitekit_reauthorize_user', array() );
		$this->assertEquals( GOOGLESITEKIT_VERSION, $initial_version->get(), 'Initial version should be set to current plugin version.' );
	}

	public function test_register_do_not_set_initial_version_if_already_set() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$auth            = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$initial_version = $this->force_get_property( $auth, 'initial_version' );

		// Ensure a version is already set.
		$initial_version->set( '1.1.0' );
		remove_all_actions( 'googlesitekit_authorize_user' );
		remove_all_actions( 'googlesitekit_reauthorize_user' );
		$auth->register();

		// Response is not used here, so just pass an array.
		do_action( 'googlesitekit_authorize_user', array(), array(), array() );
		do_action( 'googlesitekit_reauthorize_user', array() );
		$this->assertEquals( '1.1.0', $initial_version->get(), 'Initial version should remain unchanged when already set.' );
	}

	public function option_action_provider() {
		return array(
			array( 'blogname', 'example.com', 'new.example.com' ),
			array( 'googlesitekit_db_version', '1.0', '2.0' ),
		);
	}

	protected function assertAdminDataExtended() {
		$data = apply_filters( 'googlesitekit_admin_data', array() );

		$this->assertEqualSets(
			array(
				'connectURL',
				'disconnectURL',
			),
			array_keys( $data ),
			'Admin data should contain connectURL and disconnectURL keys.'
		);
	}

	protected function assertSetupDataExtended() {
		$data = apply_filters( 'googlesitekit_setup_data', array() );

		$this->assertEqualSets(
			array(
				'grantedScopes',
				'hasSearchConsoleProperty',
				'isAuthenticated',
				'isSiteKitConnected',
				'isVerified',
				'needReauthenticate',
				'requiredScopes',
				'isResettable',
				'unsatisfiedScopes',
			),
			array_keys( $data ),
			'Setup data should contain all required authentication and setup keys.'
		);
	}

	public function test_register_allowed_redirect_hosts() {
		remove_all_filters( 'allowed_redirect_hosts' );
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertEquals( '', wp_validate_redirect( 'https://accounts.google.com' ), 'Google accounts URL should not be allowed before registration.' );
		$this->assertEquals( '', wp_validate_redirect( 'https://sitekit.withgoogle.com' ), 'Site Kit URL should not be allowed before registration.' );

		$auth->register();

		$this->assertEquals( 'https://accounts.google.com', wp_validate_redirect( 'https://accounts.google.com' ), 'Google accounts URL should be allowed after registration.' );
		$this->assertEquals( 'https://sitekit.withgoogle.com', wp_validate_redirect( 'https://sitekit.withgoogle.com' ), 'Site Kit URL should be allowed after registration.' );
	}

	public function test_register_maybe_refresh_token_for_screen__admin() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$auth = new Authentication( $context, null, $user_options );

		remove_all_actions( 'current_screen' );
		remove_all_actions( 'heartbeat_tick' );
		$auth->register();
		$this->assertTrue( has_action( 'current_screen' ), 'Current screen action should be registered.' );
		$this->assertTrue( has_action( 'heartbeat_tick' ), 'Heartbeat tick action should be registered.' );

		$oauth_client = $auth->get_oauth_client();
		// Fake a valid authentication token on the OAuth client.
		$this->assertTrue(
			$oauth_client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			),
			'Should successfully set a valid OAuth token.'
		);
		// The FakeHttp handler returns 200 by default.
		FakeHttp::fake_google_http_handler( $oauth_client->get_client() );

		// Make sure we start with no errors.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Should start with no OAuth error codes.' );

		// Token should not refresh on any screen other other than the dashboard.
		do_action( 'current_screen', WP_Screen::get( 'some-random-screen' ) );
		// There should be no errors as refresh_token() should not be called as yet.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Should have no errors when on non-dashboard screen.' );

		// Token should not refresh if a user does not have credentials.
		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );
		// There should be no errors as refresh_token() should not be called as yet.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Should have no errors when user lacks credentials.' );

		// Emulate credentials.
		$this->fake_proxy_site_connection();

		// Token should still not refresh as it expires after 5 minutes.
		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );
		// There should be no errors as refresh_token() should not be called as yet.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Should have no errors when token is not near expiration.' );

		// Set the user's token to expire within 5 minutes.
		$user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, 295 );
		// Token should refresh now as all conditions have been met.
		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );

		delete_user_option( $user_id, OAuth_Client::OPTION_ERROR_CODE );

		// Set the request handler to return a response with a new access token.
		FakeHttp::fake_google_http_handler(
			$oauth_client->get_client(),
			function () {
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

		$oauth_client->refresh_token();

		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ), 'Should have no errors after successful token refresh.' );
		// Make sure the access token was updated.
		$this->assertEquals( 'new-test-access-token', $oauth_client->get_access_token(), 'Access token should be updated after refresh.' );
	}

	public function test_register_maybe_refresh_token_for_screen__editor_with_shared_modules() {
		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $editor_id );

		// Allow PageSpeed Insights to be shared with an editor.
		$test_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
			'search-console'     => array(
				'management' => 'owner',
			),
		);
		add_option( Module_Sharing_Settings::OPTION, $test_sharing_settings );

		$auth = new Authentication( $context, null, $user_options );
		$auth->register();

		$oauth_client = $auth->get_oauth_client();
		// Fake a valid authentication token on the OAuth client.
		$this->assertTrue(
			$oauth_client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			),
			'Should successfully set a valid OAuth token.'
		);
		// The FakeHttp handler returns 200 by default.
		FakeHttp::fake_google_http_handler( $oauth_client->get_client() );

		// Create owners for shareable modules and generate their oauth tokens.
		$pagespeed_insights_owner_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		update_option( PageSpeed_Insights_Settings::OPTION, array( 'ownerID' => $pagespeed_insights_owner_id ) );
		$this->set_oauth_token_for_user( $oauth_client, $user_options, $pagespeed_insights_owner_id );
		$search_console_owner_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		update_option( Search_Console_Settings::OPTION, array( 'ownerID' => $search_console_owner_id ) );
		$this->set_oauth_token_for_user( $oauth_client, $user_options, $search_console_owner_id );

		// Make sure we start with no errors.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $editor_id ), 'Editor should start with no OAuth error codes.' );
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $pagespeed_insights_owner_id ), 'PageSpeed Insights owner should start with no OAuth error codes.' );
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $search_console_owner_id ), 'Search Console owner should start with no OAuth error codes.' );

		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );

		// Token should not be refreshed for the editor who is not an authenticated admin.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $editor_id ), 'Editor should not have errors as they are not an authenticated admin.' );

		delete_user_option( $pagespeed_insights_owner_id, OAuth_Client::OPTION_ERROR_CODE );

		// Set the request handler to return a response with a new access token.
		FakeHttp::fake_google_http_handler(
			$oauth_client->get_client(),
			function () {
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

		$oauth_client->refresh_token();

		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $pagespeed_insights_owner_id ), 'PageSpeed Insights owner should have no errors after successful token refresh.' );
		// Make sure the access token was updated for the owner of the PageSpeed Insights module.
		$this->assertEquals( 'new-test-access-token', $oauth_client->get_access_token(), 'Access token should be updated for PageSpeed Insights owner after refresh.' );

		// Token should not be refreshed for the owner of search console as search console is not shared with editors.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $search_console_owner_id ), 'Search Console owner should not have errors as their module is not shared with editors.' );
	}

	private function set_oauth_token_for_user( $oauth_client, $user_options, $user_id ) {
		$restore_user = $user_options->switch_user( $user_id );
		$this->assertTrue(
			$oauth_client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			),
			'Setting OAuth token for user should return true.'
		);
		$user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, 295 );
		$restore_user();
	}

	public function test_get_oauth_client() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Clients\OAuth_Client',
			$auth->get_oauth_client(),
			'get_oauth_client() should return an OAuth_Client instance.'
		);
	}

	public function test_is_authenticated() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $auth->is_authenticated(), 'Authentication should be false when no token is set.' );

		// Fake a valid authentication token on the client.
		$auth->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->assertTrue( $auth->is_authenticated(), 'Authentication should be true when valid token is set.' );
	}

	public function test_credentials() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Credentials',
			$auth->credentials(),
			'credentials() should return a Credentials instance.'
		);
	}

	public function test_verification() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification',
			$auth->verification(),
			'verification() should return a Verification instance.'
		);
	}

	/**
	 * @expectedDeprecated Google\Site_Kit\Core\Authentication\Authentication::verification_tag
	 */
	public function test_verification_tag() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification_Meta',
			$auth->verification_tag(),
			'verification_tag() should return a Verification_Meta instance.'
		);
	}

	public function test_verification_meta() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification_Meta',
			$auth->verification_meta(),
			'verification_meta() should return a Verification_Meta instance.'
		);
	}

	public function test_verification_file() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification_File',
			$auth->verification_file(),
			'verification_file() should return a Verification_File instance.'
		);
	}

	public function test_profile() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Profile',
			$auth->profile(),
			'profile() should return a Profile instance.'
		);
	}

	public function test_get_connect_url() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$connect_url = $auth->get_connect_url();

		$this->assertStringStartsWith( admin_url( 'index.php' ), $connect_url, 'Connect URL should start with admin index.php.' );
		wp_parse_str( parse_url( $connect_url, PHP_URL_QUERY ), $params );
		$this->assertEquals( 1, wp_verify_nonce( $params['nonce'], Authentication::ACTION_CONNECT ), 'Nonce should verify for connect action.' ); // PHPCS: line 520
		$this->assertEquals( Authentication::ACTION_CONNECT, $params['action'], 'Action should be connect for connect URL.' ); // PHPCS: line 521
	}

	public function test_get_disconnect_url() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$disconnect_url = $auth->get_disconnect_url();

		$this->assertStringStartsWith( admin_url( 'index.php' ), $disconnect_url, 'Disconnect URL should start with admin index.php.' );
		wp_parse_str( parse_url( $disconnect_url, PHP_URL_QUERY ), $params );
		$this->assertEquals( 1, wp_verify_nonce( $params['nonce'], Authentication::ACTION_DISCONNECT ), 'Nonce should verify for disconnect action.' ); // PHPCS: line 531
		$this->assertEquals( Authentication::ACTION_DISCONNECT, $params['action'], 'Action should be disconnect for disconnect URL.' ); // PHPCS: line 532
	}

	public function test_handle_connect() {
		$auth           = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() ) );
		$connect_action = 'admin_action_' . Authentication::ACTION_CONNECT;
		remove_all_actions( $connect_action );
		$this->fake_proxy_site_connection();
		$auth->register();

		// Requires 'connect' nonce.
		try {
			do_action( $connect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( $e->getMessage(), array( 'The link you followed has expired.', 'Are you sure you want to do this?' ), 'Should throw expired/disallowed link error for missing connect nonce.' ); // PHPCS: line 547
		}

		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );

		// Requires authenticate permissions.
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ), 'User should not have authenticate permission initially.' );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage(), 'Should indicate missing permissions for connect.' ); // PHPCS: line 558
		}

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ), 'Editor should not have authenticate permission.' );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage(), 'Should indicate missing permissions for connect (editor).' ); // PHPCS: line 569
		}

		// Administrators can authenticate.
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );
		$this->assertTrue( current_user_can( Permissions::AUTHENTICATE ), 'Administrator should have authenticate permission.' );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected redirection to connect URL' );
		} catch ( RedirectException $e ) {
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth/', $e->get_location(), 'Should redirect to proxy OAuth URL for admin.' ); // PHPCS: line 581
		}

		// Additional scopes can be requested via the additional_scopes query parameter.
		$extra_scopes              = array( 'http://example.com/test/scope/a', 'http://example.com/test/scope/b' );
		$_GET['additional_scopes'] = $extra_scopes;
		try {
			do_action( $connect_action );
			$this->fail( 'Expected redirection to connect URL' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth/', $redirect_url, 'Should redirect to proxy OAuth URL for additional scopes.' ); // PHPCS: line 592
			parse_str( wp_parse_url( $redirect_url, PHP_URL_QUERY ), $query_args );
			$requested_scopes = explode( ' ', $query_args['scope'] );
			$this->assertContains( $extra_scopes[0], $requested_scopes, 'First additional scope should be present in requested scopes.' ); // PHPCS: line 595
			$this->assertContains( $extra_scopes[1], $requested_scopes, 'Second additional scope should be present in requested scopes.' ); // PHPCS: line 596
		}
	}

	public function test_handle_disconnect() {
		$context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$auth              = new Authentication( $context );
		$disconnect_action = 'admin_action_' . Authentication::ACTION_DISCONNECT;
		remove_all_actions( $disconnect_action );
		$auth->register();

		// Requires 'disconnect' nonce.
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( $e->getMessage(), array( 'The link you followed has expired.', 'Are you sure you want to do this?' ), 'Should throw expired/disallowed link error for missing disconnect nonce.' ); // PHPCS: line 612
		}

		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );

		// Requires authenticate permissions.
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ), 'User should not have authenticate permission for disconnect.' );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage(), 'Should indicate missing permissions for disconnect.' ); // PHPCS: line 623
		}

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ), 'Editor should not have authenticate permission for disconnect.' );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage(), 'Should indicate missing permissions for disconnect (editor).' ); // PHPCS: line 634
		}

		// Administrators can authenticate.
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );
		$this->assertTrue( current_user_can( Permissions::AUTHENTICATE ), 'Administrator should have authenticate permission for disconnect.' );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected redirection to splash URL' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertStringStartsWith( $context->admin_url( 'splash' ), $redirect_url, 'Should redirect to splash page after disconnect.' ); // PHPCS: line 649
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 1, $params['googlesitekit_reset_session'], 'Reset session parameter should be set to 1 after disconnect.' );
		}
	}

	public function test_get_proxy_setup_url() {
		$class  = new \ReflectionClass( Authentication::class );
		$method = $class->getMethod( 'get_proxy_setup_url' );
		$method->setAccessible( true );

		$url = $method->invokeArgs(
			new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ),
			array()
		);

		$this->assertNotEmpty( filter_var( $url, FILTER_VALIDATE_URL ), 'Proxy setup URL should be a valid URL.' ); // PHPCS: line 663
		$this->assertStringStartsWith( admin_url(), $url, 'URL should start with admin URL.' );

		$args = array();
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertArrayHasKey( 'action', $args, 'Proxy setup URL should have action param.' ); // PHPCS: line 669
		$this->assertArrayHasKey( 'nonce', $args, 'Proxy setup URL should have nonce param.' ); // PHPCS: line 670
		$this->assertEquals( Google_Proxy::ACTION_SETUP_START, $args['action'], 'Proxy setup URL action should match.' ); // PHPCS: line 672
	}

	public function test_set_connected_proxy_url() {
		remove_all_actions( 'googlesitekit_authorize_user' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );

		$authentication = new Authentication( $context, $options );
		$authentication->register();

		$home_url_hook = function () {
			return 'https://example.com/subsite';
		};

		add_filter( 'home_url', $home_url_hook );
		do_action( 'googlesitekit_authorize_user', array(), array(), array() );
		remove_filter( 'home_url', $home_url_hook );

		$this->assertEquals( 'https://example.com/subsite/', $options->get( Connected_Proxy_URL::OPTION ), 'Connected proxy URL should be set to filtered home_url.' ); // PHPCS: line 692
	}

	public function test_check_connected_proxy_url() {
		remove_all_actions( 'admin_init' );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context );

		$authentication = new Authentication( $context, $options, $user_options );
		$authentication->register();

		// Set connected proxy URL to something else to emulate URL mismatch.
		$options->set( Connected_Proxy_URL::OPTION, '/' );

		// Emulate credentials.
		$this->fake_proxy_site_connection();

		// Emulate OAuth acccess token.
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		// Ensure admin user has Permissions::SETUP cap regardless of authentication.
		add_filter(
			'user_has_cap',
			function ( $caps ) {
				$caps[ Permissions::SETUP ] = true;
				return $caps;
			}
		);

		do_action( 'admin_init' );

		$this->assertEquals(
			Disconnected_Reason::REASON_CONNECTED_URL_MISMATCH,
			$user_options->get( Disconnected_Reason::OPTION ),
			'User option should be set to URL mismatch reason after admin_init.' // PHPCS: line 728
		);
	}

	/**
	 * Test handle_proxy_permissions()
	 */
	public function test_handle_proxy_permissions() {
		$action = 'admin_action_' . Google_Proxy::ACTION_PERMISSIONS;
		remove_all_actions( $action );

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$admin_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $editor_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$options      = new Options( $context );
		$user_options = new User_Options( $context );

		$authentication = new Authentication( $context, $options, $user_options );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );
		$authentication->register();

		// Requires 'googlesitekit_proxy_permissions' nonce.
		try {
			do_action( $action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( Exception $e ) {
			$this->assertEquals( 'The link you followed has expired.</p><p><a href="http://example.org/wp-admin/admin.php?page=googlesitekit-splash">Please try again</a>. Retry didn’t work? <a href="https://sitekit.withgoogle.com/support?error_id=nonce_expired" target="_blank">Get help</a>.', $e->getMessage(), 'Should throw expired link error for missing proxy permissions nonce.' ); // PHPCS: line 759
		}

		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_PERMISSIONS );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ), 'User should not have authenticate permission for proxy permissions.' );

		// Requires Site Kit Authenticate permissions
		try {
			do_action( $action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( Exception $e ) {
			$this->assertStringContainsString( 'insufficient permissions to manage Site Kit permissions', $e->getMessage(), 'Should indicate insufficient permissions for proxy permissions.' ); // PHPCS: line 770
		}

		wp_set_current_user( $admin_id );
		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_PERMISSIONS );
		$this->assertTrue( current_user_can( Permissions::AUTHENTICATE ), 'Administrator should have authenticate permission for proxy permissions.' );

		// Requires Proxy Authentication
		$this->fake_site_connection();

		try {
			do_action( $action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( Exception $e ) {
			$this->assertStringContainsString( 'Site Kit is not configured to use the authentication proxy', $e->getMessage(), 'Should indicate proxy authentication is not configured.' ); // PHPCS: line 784
		}

		list( $site_id ) = $this->fake_proxy_site_connection();

		try {
			do_action( $action );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/site-management/permissions/', $location, 'Should redirect to proxy permissions URL.' ); // PHPCS: line 793

			$parsed = wp_parse_url( $location );
			parse_str( $parsed['query'], $query_args );

			$this->assertEquals( $site_id, $query_args['site_id'], 'Site ID in query args should match fake proxy site ID.' ); // PHPCS: line 798
		}
	}

	public function test_invalid_nonce_error_non_sitekit_action() {
		try {
			$authentication = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
			$authentication->invalid_nonce_error( 'log-out' );
		} catch ( WPDieException $exception ) {
			$this->assertStringStartsWith( 'You are attempting to log out of Test Blog', $exception->getMessage(), 'Should show logout message for invalid nonce error.' );
			return;
		}
		$this->fail( 'Expected WPDieException!' );
	}

	public function test_invalid_nonce_error_sitekit_action() {
		try {
			$authentication = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
			$authentication->invalid_nonce_error( 'googlesitekit_proxy_foo_action' );
		} catch ( WPDieException $exception ) {
			$this->assertEquals( 'The link you followed has expired.</p><p><a href="http://example.org/wp-admin/admin.php?page=googlesitekit-splash">Please try again</a>. Retry didn’t work? <a href="https://sitekit.withgoogle.com/support?error_id=nonce_expired" target="_blank">Get help</a>.', $exception->getMessage(), 'Should show logout message for invalid nonce error.' );
			return;
		}
		$this->fail( 'Expected WPDieException!' );
	}

	public function test_googlesitekit_inline_base_data_standard_version() {
		$version = get_bloginfo( 'version' );

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		add_filter( 'plugins_auto_update_enabled', '__return_true' );

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );
		$this->assertArrayHasKey( 'wpVersion', $data, 'Inline base data should have wpVersion key.' ); // PHPCS: line 833
		$this->assertEquals( $version, $data['wpVersion']['version'], 'Inline base data wpVersion should match blog version.' ); // PHPCS: line 834

		if ( version_compare( $version, '5.5', '>=' ) ) {
			$this->assertTrue( $data['changePluginAutoUpdatesCapacity'], 'Plugin auto-updates capacity should be changeable when user has permission.' );
			$this->assertFalse( $data['siteKitAutoUpdatesEnabled'], 'Site Kit auto-updates should be disabled by default.' );
		}
	}

	public function test_googlesitekit_inline_base_data_plugin_autoupdate_force_disabled() {
		$version = get_bloginfo( 'version' );

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		add_filter( 'plugins_auto_update_enabled', '__return_true' );
		add_filter( 'auto_update_plugin', '__return_false' );

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		if ( version_compare( $version, '5.6', '>=' ) ) {
			$this->assertFalse( $data['changePluginAutoUpdatesCapacity'], 'Plugin auto-updates capacity should not be changeable when auto-update is disabled.' );
		} elseif ( version_compare( $version, '5.5', '>=' ) ) {
			$this->assertTrue( $data['changePluginAutoUpdatesCapacity'], 'Plugin auto-updates capacity should be changeable when auto-update is enabled.' );
		}
	}

	public function test_googlesitekit_inline_base_data_plugin_autoupdate_disabled() {
		$version = get_bloginfo( 'version' );

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );

		add_filter( 'plugins_auto_update_enabled', '__return_false' );

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		if ( version_compare( $version, '5.5', '>=' ) ) {
			$this->assertFalse( $data['changePluginAutoUpdatesCapacity'], 'Plugin auto-updates capacity should not be changeable when plugins auto-update is disabled.' );
		}
	}

	public function test_googlesitekit_inline_base_data_plugin_autoupdates_forced() {
		$version = get_bloginfo( 'version' );

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );

		add_filter( 'plugins_auto_update_enabled', '__return_true' );
		add_filter( 'auto_update_plugin', '__return_true' );

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		if ( version_compare( $version, '5.5', '>=' ) ) {
			$this->assertFalse( $data['changePluginAutoUpdatesCapacity'], 'Plugin auto-updates capacity should not be changeable when auto-updates are forced.' );
		}
	}

	public function test_googlesitekit_inline_js_wp_version_non_standard_version() {
		$version = '42';

		$class  = new \ReflectionClass( Authentication::class );
		$method = $class->getMethod( 'inline_js_wp_version' );
		$method->setAccessible( true );

		$js_inline_wp_version = $method->invokeArgs(
			new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ),
			array( $version )
		);

		$this->assertEquals( '42', $js_inline_wp_version['version'], 'Inline JS WP version should match input version.' ); // PHPCS: line 903
		$this->assertEquals( '42', $js_inline_wp_version['major'], 'Inline JS WP major version should match input version.' ); // PHPCS: line 904
		$this->assertEquals( '0', $js_inline_wp_version['minor'], 'Inline JS WP minor version should be zero.' ); // PHPCS: line 905
	}

	/**
	 * @param string $site_url
	 * @param string? $expected_redirect
	 * @dataProvider data_site_urls
	 */
	public function test_allowed_redirect_hosts( $site_url, $expected_redirect ) {
		remove_all_filters( 'allowed_redirect_hosts' );
		$authentication = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$authentication->register();

		if ( null === $expected_redirect ) {
			$expected_redirect = $site_url;
		}

		update_option( 'home', $site_url );
		update_option( 'siteurl', $site_url );

		try {
			wp_safe_redirect( $site_url ); // phpcs:ignore WordPressVIPMinimum.Security.ExitAfterRedirect.NoExit
			$this->fail( 'Expected redirection to site URL!' );
		} catch ( RedirectException $redirect ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// The test will fail if this isn't thrown so we can continue below.
		}

		$this->assertEquals( $expected_redirect, $redirect->get_location(), 'Allowed redirect host should match expected.' ); // PHPCS: line 932
	}

	public function data_site_urls() {
		return array(
			'common ascii'   => array( 'https://example.com', null ),
			'punycode ascii' => array( 'https://xn--xmpl-loa2a55a.test', null ),
			'unicode'        => array( 'https://éxämplę.test', 'https://' . rawurlencode( 'éxämplę.test' ) ),
		);
	}

	public function test_get_feature_metrics() {
		update_site_option( 'auto_update_plugins', array( 'other-plugin.php', GOOGLESITEKIT_PLUGIN_BASENAME ) );

		$authentication  = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$feature_metrics = $authentication->get_feature_metrics();

		$this->assertEquals(
			array( 'auto_updates_enabled' => true ),
			$feature_metrics,
			'Feature metrics should indicate that auto-updates are enabled when Site Kit is in the list of auto-update plugins.'
		);
	}

	protected function get_user_option_keys() {
		return array(
			OAuth_Client::OPTION_ACCESS_TOKEN,
			OAuth_Client::OPTION_ACCESS_TOKEN_CREATED,
			OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN,
			OAuth_Client::OPTION_AUTH_SCOPES,
			OAuth_Client::OPTION_ERROR_CODE,
			OAuth_Client::OPTION_REDIRECT_URL,
			OAuth_Client::OPTION_REFRESH_TOKEN,
			Profile::OPTION,
			Verification::OPTION,
			Verification_Meta::OPTION,
		);
	}
}
