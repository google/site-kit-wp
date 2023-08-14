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
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
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
		$this->assertTrue( has_action( 'admin_init' ) );
		$this->assertTrue( has_action( OAuth_Client::CRON_REFRESH_PROFILE_DATA ) );
		$this->assertTrue( has_action( 'googlesitekit_authorize_user' ) );

		$this->assertAdminDataExtended();
		$this->assertSetupDataExtended();

		$this->assertFalse( is_network_admin() );
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
			array_filter( $notice_slugs )
		);
	}

	public function test_register__setup_transient_features_cron() {
		remove_all_actions( 'googlesitekit_cron_update_remote_features' );
		wp_clear_scheduled_hook( 'googlesitekit_cron_update_remote_features' );

		$this->assertFalse( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$this->assertFalse(
			wp_next_scheduled( 'googlesitekit_cron_update_remote_features' )
		);

		$current_time = time();

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$auth->register();

		$this->assertTrue( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( 'googlesitekit_cron_update_remote_features' )
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
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );

		$user_data = apply_filters( 'googlesitekit_user_data', array() );
		$this->assertEqualSets(
			array(
				'connectURL',
				'initialVersion',
				'isUserInputCompleted',
				'verified',
				'hasMultipleAdmins',
			),
			array_keys( $user_data )
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
			array_keys( $user_data )
		);
		$this->assertEquals( $email, $user_data['user']['email'] );
		$this->assertEquals( $photo, $user_data['user']['picture'] );
		$this->assertEquals( $full_name, $user_data['user']['full_name'] );
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

		$this->assertTrue( has_action( 'shutdown' ), $option );
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

		$this->assertTrue( has_action( 'googlesitekit_authorize_user' ) );
		$this->assertTrue( has_action( 'googlesitekit_reauthorize_user' ) );

		// Response is not used here, so just pass an array.
		do_action( 'googlesitekit_reauthorize_user', array() );
		$this->assertEquals( GOOGLESITEKIT_VERSION, $initial_version->get() );
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
		$this->assertEquals( '1.1.0', $initial_version->get() );
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
			array_keys( $data )
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
			array_keys( $data )
		);
	}

	public function test_register_allowed_redirect_hosts() {
		remove_all_filters( 'allowed_redirect_hosts' );
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertEquals( '', wp_validate_redirect( 'https://accounts.google.com' ) );
		$this->assertEquals( '', wp_validate_redirect( 'https://sitekit.withgoogle.com' ) );

		$auth->register();

		$this->assertEquals( 'https://accounts.google.com', wp_validate_redirect( 'https://accounts.google.com' ) );
		$this->assertEquals( 'https://sitekit.withgoogle.com', wp_validate_redirect( 'https://sitekit.withgoogle.com' ) );
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
		$this->assertTrue( has_action( 'current_screen' ) );
		$this->assertTrue( has_action( 'heartbeat_tick' ) );

		$oauth_client = $auth->get_oauth_client();
		// Fake a valid authentication token on the OAuth client.
		$this->assertTrue(
			$oauth_client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			)
		);
		// The FakeHttp handler returns 200 by default.
		FakeHttp::fake_google_http_handler( $oauth_client->get_client() );

		// Make sure we start with no errors.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		// Token should not refresh on any screen other other than the dashboard.
		do_action( 'current_screen', WP_Screen::get( 'some-random-screen' ) );
		// There should be no errors as refresh_token() should not be called as yet.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		// Token should not refresh if a user does not have credentials.
		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );
		// There should be no errors as refresh_token() should not be called as yet.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		// Emulate credentials.
		$this->fake_proxy_site_connection();

		// Token should still not refresh as it expires after 5 minutes.
		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );
		// There should be no errors as refresh_token() should not be called as yet.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );

		// Set the user's token to expire within 5 minutes.
		$user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, 295 );
		// Token should refresh now as all conditions have been met.
		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );

		delete_user_option( $user_id, OAuth_Client::OPTION_ERROR_CODE );

		// Set the request handler to return a response with a new access token.
		FakeHttp::fake_google_http_handler(
			$oauth_client->get_client(),
			function () {
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

		$oauth_client->refresh_token();

		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $user_id ) );
		// Make sure the access token was updated.
		$this->assertEquals( 'new-test-access-token', $oauth_client->get_access_token() );
	}

	public function test_register_maybe_refresh_token_for_screen__admin_without_shared_modules() {
		$this->enable_feature( 'dashboardSharing' );
		$this->test_register_maybe_refresh_token_for_screen__admin();
	}

	public function test_register_maybe_refresh_token_for_screen__editor_with_shared_modules() {
		$this->enable_feature( 'dashboardSharing' );
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

		// Re-register Permissions after enabling the dashboardSharing feature to include dashboard sharing capabilities.
		$permissions = new Permissions( $context, $auth, new Modules( $context ), $user_options, new Dismissed_Items( $user_options ) );
		$permissions->register();

		$oauth_client = $auth->get_oauth_client();
		// Fake a valid authentication token on the OAuth client.
		$this->assertTrue(
			$oauth_client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			)
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
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $editor_id ) );
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $pagespeed_insights_owner_id ) );
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $search_console_owner_id ) );

		do_action( 'current_screen', WP_Screen::get( 'toplevel_page_googlesitekit-dashboard' ) );

		// Token should not be refreshed for the editor who is not an authenticated admin.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $editor_id ) );

		delete_user_option( $pagespeed_insights_owner_id, OAuth_Client::OPTION_ERROR_CODE );

		// Set the request handler to return a response with a new access token.
		FakeHttp::fake_google_http_handler(
			$oauth_client->get_client(),
			function () {
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

		$oauth_client->refresh_token();

		$this->assertEmpty( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $pagespeed_insights_owner_id ) );
		// Make sure the access token was updated for the owner of the PageSpeed Insights module.
		$this->assertEquals( 'new-test-access-token', $oauth_client->get_access_token() );

		// Token should not be refreshed for the owner of search console as search console is not shared with editors.
		$this->assertFalse( get_user_option( OAuth_Client::OPTION_ERROR_CODE, $search_console_owner_id ) );
	}

	private function set_oauth_token_for_user( $oauth_client, $user_options, $user_id ) {
		$restore_user = $user_options->switch_user( $user_id );
		$this->assertTrue(
			$oauth_client->set_token(
				array(
					'access_token'  => 'test-access-token',
					'refresh_token' => 'test-refresh-token',
				)
			)
		);
		$user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, 295 );
		$restore_user();
	}

	public function test_get_oauth_client() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Clients\OAuth_Client',
			$auth->get_oauth_client()
		);
	}

	public function test_is_authenticated() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $auth->is_authenticated() );

		// Fake a valid authentication token on the client.
		$auth->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->assertTrue( $auth->is_authenticated() );
	}

	public function test_credentials() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Credentials',
			$auth->credentials()
		);
	}

	public function test_verification() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification',
			$auth->verification()
		);
	}

	/**
	 * @expectedDeprecated Google\Site_Kit\Core\Authentication\Authentication::verification_tag
	 */
	public function test_verification_tag() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification_Meta',
			$auth->verification_tag()
		);
	}

	public function test_verification_meta() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification_Meta',
			$auth->verification_meta()
		);
	}

	public function test_verification_file() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification_File',
			$auth->verification_file()
		);
	}

	public function test_profile() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Profile',
			$auth->profile()
		);
	}

	public function test_disconnect() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user_id );
		$auth         = new Authentication( $context, $options, $user_options );

		foreach ( $this->get_user_option_keys() as $key ) {
			$user_options->set( $key, "test-$key-value" );
		}

		$mock_google_client = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'revokeToken' ) )->getMock();
		$mock_google_client->expects( $this->once() )->method( 'revokeToken' );
		$this->force_set_property( $auth->get_oauth_client(), 'google_client', $mock_google_client );

		$auth->disconnect();

		foreach ( $this->get_user_option_keys() as $key ) {
			$this->assertFalse( $user_options->get( $key ) );
		}
	}

	public function test_get_connect_url() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$connect_url = $auth->get_connect_url();

		$this->assertStringStartsWith( admin_url( 'index.php' ), $connect_url );
		wp_parse_str( parse_url( $connect_url, PHP_URL_QUERY ), $params );
		$this->assertEquals( 1, wp_verify_nonce( $params['nonce'], Authentication::ACTION_CONNECT ) );
		$this->assertEquals( Authentication::ACTION_CONNECT, $params['action'] );
	}

	public function test_get_disconnect_url() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$disconnect_url = $auth->get_disconnect_url();

		$this->assertStringStartsWith( admin_url( 'index.php' ), $disconnect_url );
		wp_parse_str( parse_url( $disconnect_url, PHP_URL_QUERY ), $params );
		$this->assertEquals( 1, wp_verify_nonce( $params['nonce'], Authentication::ACTION_DISCONNECT ) );
		$this->assertEquals( Authentication::ACTION_DISCONNECT, $params['action'] );
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
			$this->assertContains( $e->getMessage(), array( 'The link you followed has expired.', 'Are you sure you want to do this?' ) );
		}

		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );

		// Requires authenticate permissions.
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage() );
		}

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage() );
		}

		// Administrators can authenticate.
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );
		$this->assertTrue( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected redirection to connect URL' );
		} catch ( RedirectException $e ) {
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth/', $e->get_location() );
		}

		// Additional scopes can be requested via the additional_scopes query parameter.
		$extra_scopes              = array( 'http://example.com/test/scope/a', 'http://example.com/test/scope/b' );
		$_GET['additional_scopes'] = $extra_scopes;
		try {
			do_action( $connect_action );
			$this->fail( 'Expected redirection to connect URL' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth/', $redirect_url );
			parse_str( wp_parse_url( $redirect_url, PHP_URL_QUERY ), $query_args );
			$requested_scopes = explode( ' ', $query_args['scope'] );
			$this->assertContains( $extra_scopes[0], $requested_scopes );
			$this->assertContains( $extra_scopes[1], $requested_scopes );
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
			$this->assertContains( $e->getMessage(), array( 'The link you followed has expired.', 'Are you sure you want to do this?' ) );
		}

		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );

		// Requires authenticate permissions.
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage() );
		}

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'have permissions to authenticate', $e->getMessage() );
		}

		// Administrators can authenticate.
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );
		$this->assertTrue( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected redirection to splash URL' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertStringStartsWith( $context->admin_url( 'splash' ), $redirect_url );
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 1, $params['googlesitekit_reset_session'] );
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

		$this->assertNotEmpty( filter_var( $url, FILTER_VALIDATE_URL ) );
		$this->assertStringStartsWith( admin_url(), $url );

		$args = array();
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertArrayHasKey( 'action', $args );
		$this->assertArrayHasKey( 'nonce', $args );

		$this->assertEquals( Google_Proxy::ACTION_SETUP_START, $args['action'] );
	}

	public function test_set_connected_proxy_url() {
		remove_all_actions( 'googlesitekit_authorize_user' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );

		$authentication = new Authentication( $context, $options );
		$authentication->register();

		$home_url_hook = function() {
			return 'https://example.com/subsite';
		};

		add_filter( 'home_url', $home_url_hook );
		do_action( 'googlesitekit_authorize_user', array(), array(), array() );
		remove_filter( 'home_url', $home_url_hook );

		$this->assertEquals( 'https://example.com/subsite/', $options->get( Connected_Proxy_URL::OPTION ) );
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
			function( $caps ) {
				$caps[ Permissions::SETUP ] = true;
				return $caps;
			}
		);

		do_action( 'admin_init' );

		$this->assertEquals(
			Disconnected_Reason::REASON_CONNECTED_URL_MISMATCH,
			$user_options->get( Disconnected_Reason::OPTION )
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
			$this->assertEquals( 'The link you followed has expired.</p><p><a href="http://example.org/wp-admin/admin.php?page=googlesitekit-splash">Please try again</a>. Retry didn’t work? <a href="https://sitekit.withgoogle.com/support?error_id=nonce_expired" target="_blank">Get help</a>.', $e->getMessage() );
		}

		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_PERMISSIONS );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );

		// Requires Site Kit Authenticate permissions
		try {
			do_action( $action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( Exception $e ) {
			$this->assertStringContainsString( 'insufficient permissions to manage Site Kit permissions', $e->getMessage() );
		}

		wp_set_current_user( $admin_id );
		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_PERMISSIONS );
		$this->assertTrue( current_user_can( Permissions::AUTHENTICATE ) );

		// Requires Proxy Authentication
		$this->fake_site_connection();

		try {
			do_action( $action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( Exception $e ) {
			$this->assertStringContainsString( 'Site Kit is not configured to use the authentication proxy', $e->getMessage() );
		}

		list( $site_id ) = $this->fake_proxy_site_connection();

		try {
			do_action( $action );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/site-management/permissions/', $location );

			$parsed = wp_parse_url( $location );
			parse_str( $parsed['query'], $query_args );

			$this->assertEquals( $site_id, $query_args['site_id'] );
		}
	}

	public function test_filter_features_via_proxy() {
		remove_all_filters( 'googlesitekit_is_feature_enabled' );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new Authentication( $context );
		$google_proxy   = $authentication->get_google_proxy();

		$this->assertFalse( has_filter( 'googlesitekit_is_feature_enabled' ) );
		$authentication->register();
		$this->assertTrue( has_filter( 'googlesitekit_is_feature_enabled' ) );

		$proxy_server_requests = array();
		// Fake a successful response IF a request is made to the Google Proxy server.
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $google_proxy, &$proxy_server_requests ) {
				if ( $google_proxy->url( Google_Proxy::FEATURES_URI ) !== $url ) {
					return $preempt;
				}
				// Collect any HTTP requests to the proxy server to fetch enabled features.
				$proxy_server_requests[] = $args;

				$data = array(
					'userInput'       => array( 'enabled' => true ),
					'test.featureOne' => array( 'enabled' => true ),
					'test.featureTwo' => array( 'enabled' => false ),
				);

				return array(
					'headers'  => array(),
					'body'     => wp_json_encode( $data ),
					'response' => array( 'code' => 200 ),
				);
			},
			10,
			3
		);

		// Test original feature values are returned as a request to the Google Proxy server
		// should not be made when site is not connected.
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', false, 'nonExisting' ) );
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', false, 'test.featureOne' ) );
		$this->assertTrue( apply_filters( 'googlesitekit_is_feature_enabled', true, 'test.featureTwo' ) );

		$this->fake_proxy_site_connection();

		// Till this point, no requests should have been made to the Google Proxy server.
		$this->assertEmpty( $proxy_server_requests );
		$this->assertOptionNotExists( 'googlesitekitpersistent_remote_features' );

		// Test that requests to the Google Proxy server are made and data from the response is returned correctly.
		$this->assertTrue( apply_filters( 'googlesitekit_is_feature_enabled', false, 'test.featureOne' ) );
		$this->assertCount( 1, $proxy_server_requests );
		$this->assertOptionExists( 'googlesitekitpersistent_remote_features' );

		// Test that subsequent feature checks will not make requests to the Google Proxy server and use the
		// persistent option.
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', true, 'test.featureTwo' ) );
		$this->assertCount( 1, $proxy_server_requests );
	}

	public function test_cron_update_remote_features() {
		remove_all_actions( 'googlesitekit_cron_update_remote_features' );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new Authentication( $context );

		$this->assertFalse( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$authentication->register();
		$this->assertTrue( has_action( 'googlesitekit_cron_update_remote_features' ) );

		$google_proxy          = $authentication->get_google_proxy();
		$features_request_url  = $google_proxy->url( Google_Proxy::FEATURES_URI );
		$proxy_server_requests = array();
		// Collect any HTTP requests to the proxy server to fetch enabled features.
		$this->subscribe_to_wp_http_requests(
			function ( $url, $args ) use ( &$proxy_server_requests, $features_request_url ) {
				if ( $features_request_url === $url ) {
					$proxy_server_requests[] = $args;
				}
			}
		);

		// No requests should be made when the site is not connected.
		do_action( 'googlesitekit_cron_update_remote_features' );
		$this->assertEmpty( $proxy_server_requests );

		$this->fake_proxy_site_connection();

		// Test that a request to the Google Proxy server is made when the site is connected.
		do_action( 'googlesitekit_cron_update_remote_features' );
		$this->assertCount( 1, $proxy_server_requests );
	}

	public function test_cron_update_remote_features__wp_error() {
		remove_all_actions( 'googlesitekit_cron_update_remote_features' );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new Authentication( $context );
		$google_proxy   = $authentication->get_google_proxy();
		$authentication->register();

		$proxy_server_requests = array();
		// Fake an unsuccessful response IF a request is made to the Google Proxy server.
		add_filter(
			'pre_http_request',
			function( $preempt, $args, $url ) use ( $google_proxy, &$proxy_server_requests ) {
				if ( $google_proxy->url( Google_Proxy::FEATURES_URI ) !== $url ) {
					return $preempt;
				}
				// Collect any HTTP requests to the proxy server to fetch enabled features.
				$proxy_server_requests[] = $args;
				return new WP_Error( 'test_error', 'test_error_message' );
			},
			10,
			3
		);

		$this->fake_proxy_site_connection();
		$test_features = array(
			'userInput'       => array( 'enabled' => true ),
			'test.featureOne' => array( 'enabled' => true ),
			'test.featureTwo' => array( 'enabled' => false ),
		);
		// Set the persistent option to mock saved data from a previous successful fetch.
		update_option( 'googlesitekitpersistent_remote_features', $test_features );
		$this->assertOptionExists( 'googlesitekitpersistent_remote_features' );

		// Execute the cron action and test if a request was made to the Google Proxy server.
		do_action( 'googlesitekit_cron_update_remote_features' );
		$this->assertCount( 1, $proxy_server_requests );

		// Test that the persistent option remains untouched for an unsuccesful response.
		$this->assertEquals( $test_features, get_option( 'googlesitekitpersistent_remote_features' ) );
	}

	public function test_invalid_nonce_error_non_sitekit_action() {
		try {
			$authentication = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
			$authentication->invalid_nonce_error( 'log-out' );
		} catch ( WPDieException $exception ) {
			$this->assertStringStartsWith( 'You are attempting to log out of Test Blog', $exception->getMessage() );
			return;
		}
		$this->fail( 'Expected WPDieException!' );
	}

	public function test_invalid_nonce_error_sitekit_action() {
		try {
			$authentication = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
			$authentication->invalid_nonce_error( 'googlesitekit_proxy_foo_action' );
		} catch ( WPDieException $exception ) {
			$this->assertEquals( 'The link you followed has expired.</p><p><a href="http://example.org/wp-admin/admin.php?page=googlesitekit-splash">Please try again</a>. Retry didn’t work? <a href="https://sitekit.withgoogle.com/support?error_id=nonce_expired" target="_blank">Get help</a>.', $exception->getMessage() );
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
		$this->assertArrayHasKey( 'wpVersion', $data );
		$this->assertEquals( $version, $data['wpVersion']['version'] );

		if ( version_compare( $version, '5.5', '>=' ) ) {
			$this->assertTrue( $data['changePluginAutoUpdatesCapacity'] );
			$this->assertFalse( $data['siteKitAutoUpdatesEnabled'] );
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
			$this->assertFalse( $data['changePluginAutoUpdatesCapacity'] );
		} elseif ( version_compare( $version, '5.5', '>=' ) ) {
			$this->assertTrue( $data['changePluginAutoUpdatesCapacity'] );
		}
	}

	public function test_googlesitekit_inline_base_data_plugin_autoupdate_disabled() {
		$version = get_bloginfo( 'version' );

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );

		add_filter( 'plugins_auto_update_enabled', '__return_false' );

		$data = apply_filters( 'googlesitekit_inline_base_data', array() );

		if ( version_compare( $version, '5.5', '>=' ) ) {
			$this->assertFalse( $data['changePluginAutoUpdatesCapacity'] );
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
			$this->assertFalse( $data['changePluginAutoUpdatesCapacity'] );
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

		$this->assertEquals( '42', $js_inline_wp_version['version'] );
		$this->assertEquals( '42', $js_inline_wp_version['major'] );
		$this->assertEquals( '0', $js_inline_wp_version['minor'] );
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

		$this->assertEquals( $expected_redirect, $redirect->get_location() );
	}

	public function data_site_urls() {
		return array(
			'common ascii'   => array( 'https://example.com', null ),
			'punycode ascii' => array( 'https://xn--xmpl-loa2a55a.test', null ),
			'unicode'        => array( 'https://éxämplę.test', 'https://' . rawurlencode( 'éxämplę.test' ) ),
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
