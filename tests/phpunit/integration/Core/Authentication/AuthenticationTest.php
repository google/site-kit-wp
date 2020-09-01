<?php
/**
 * AuthenticationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Notice;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use WPDieException;

/**
 * @group Authentication
 */
class AuthenticationTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_register() {
		remove_all_actions( 'init' );
		remove_all_actions( 'admin_head' );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_filters( 'googlesitekit_setup_data' );
		remove_all_filters( 'googlesitekit_admin_notices' );
		remove_all_actions( OAuth_Client::CRON_REFRESH_PROFILE_DATA );

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$auth->register();

		// Authentication::handle_oauth is invoked on init but we cannot test it due to use of filter_input.
		$this->assertTrue( has_action( 'init' ) );

		$this->assertTrue( has_action( 'admin_action_' . Google_Proxy::ACTION_SETUP ) );
		$this->assertTrue( has_action( OAuth_Client::CRON_REFRESH_PROFILE_DATA ) );

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
				'oauth_error',
			),
			array_filter( $notice_slugs )
		);
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

	public function option_action_provider() {
		return array(
			array( 'home', 'http://example.com', 'http://new.example.com' ),
			array( 'siteurl', 'http://example.com', 'http://new.example.com' ),
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
				'moduleToSetup',
				'needReauthenticate',
				'requiredScopes',
				'showModuleSetupWizard',
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

	public function test_verify_proxy_setup_nonce() {
		$setup_proxy_admin_action = 'admin_action_' . Google_Proxy::ACTION_SETUP;
		remove_all_actions( $setup_proxy_admin_action );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$auth    = new Authentication( $context );
		$auth->register();

		// Ensure that wp_die is called if nonce verification fails.
		$_GET['nonce'] = 'bad-nonce';

		try {
			do_action( $setup_proxy_admin_action );
		} catch ( WPDieException $exception ) {
			$this->assertEquals( 'Invalid nonce.', $exception->getMessage() );
			return;
		}

		$this->fail( 'Expected WPDieException!' );
	}

	public function test_handle_site_code_and_redirect_to_proxy() {
		remove_all_actions( 'admin_action_googlesitekit_proxy_setup' );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$credentials = new Credentials( new Encrypted_Options( new Options( $context ) ) );
		$auth        = new Authentication( $context );
		$auth->register();
		$google_proxy = new Google_Proxy( $context );

		$this->assertTrue( has_action( 'admin_action_googlesitekit_proxy_setup' ) );
		$this->assertFalse( $credentials->has() );

		// For site code to be processed, the code and nonce must be present.
		$_GET['googlesitekit_code']      = 'test-code';
		$_GET['googlesitekit_site_code'] = 'test-site-code';

		// Stub the response to the proxy oauth API.
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $google_proxy ) {
				if ( $google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ) !== $url ) {
					return $preempt;
				}

				return array(
					'headers'       => array(),
					'body'          => json_encode(
						array(
							'site_id'     => 'test-site-id.apps.sitekit.withgoogle.com',
							'site_secret' => 'test-site-secret',
						)
					),
					'response'      => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'cookies'       => array(),
					'http_response' => null,
				);
			},
			10,
			3
		);

		$_GET['nonce'] = wp_create_nonce( 'googlesitekit_proxy_setup' );

		try {
			do_action( 'admin_action_googlesitekit_proxy_setup' );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/site-management/setup/', $location );
			$parsed = wp_parse_url( $location );
			parse_str( $parsed['query'], $query_args );
			$this->assertEquals( 'test-site-id.apps.sitekit.withgoogle.com', $query_args['site_id'] );
			$this->assertEquals( 'test-code', $query_args['code'] );
		}

		$saved_creds = $credentials->get();
		$this->assertEquals( 'test-site-id.apps.sitekit.withgoogle.com', $saved_creds['oauth2_client_id'] );
		$this->assertEquals( 'test-site-secret', $saved_creds['oauth2_client_secret'] );
	}

	public function test_get_oauth_client() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Clients\OAuth_Client',
			$auth->get_oauth_client()
		);
	}

	public function test_is_authenticated() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $auth->is_authenticated() );

		// Fake a valid authentication token on the client.
		$this->force_set_property( $auth->get_oauth_client(), 'access_token', 'valid-auth-token' );

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

		$this->assertStringStartsWith( admin_url(), $connect_url );
		wp_parse_str( parse_url( $connect_url, PHP_URL_QUERY ), $params );
		$this->assertEquals( 1, wp_verify_nonce( $params['nonce'], 'connect' ) );
		$this->assertArraySubset(
			array(
				'googlesitekit_connect' => 1,
				'page'                  => 'googlesitekit-splash',
			),
			$params
		);
	}

	public function test_get_disconnect_url() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$disconnect_url = $auth->get_disconnect_url();

		$this->assertStringStartsWith( admin_url(), $disconnect_url );
		wp_parse_str( parse_url( $disconnect_url, PHP_URL_QUERY ), $params );
		$this->assertEquals( 1, wp_verify_nonce( $params['nonce'], 'disconnect' ) );
		$this->assertArraySubset(
			array(
				'googlesitekit_disconnect' => 1,
				'page'                     => 'googlesitekit-splash',
			),
			$params
		);
	}

	public function test_googlesitekit_connect() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() ) );
		remove_all_actions( 'init' );
		$this->fake_proxy_site_connection();
		$auth->register();

		// Does nothing if query parameter is not set, and not is_admin.
		$this->assertTrue( empty( $_GET['googlesitekit_connect'] ) );
		$this->assertFalse( is_admin() );
		do_action( 'init' );

		$_GET['googlesitekit_connect'] = 1;
		// Does nothing if not is_admin.
		$this->assertFalse( is_admin() );
		do_action( 'init' );

		set_current_screen( 'dashboard' );
		$this->assertTrue( is_admin() );

		// Requires 'connect' nonce.
		try {
			do_action( 'init' );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertEquals( 'Invalid nonce.', $e->getMessage() );
		}

		$_GET['nonce'] = wp_create_nonce( 'connect' );

		// Requires authenticate permissions.
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( 'init' );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( 'have permissions to authenticate', $e->getMessage() );
		}

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$_GET['nonce'] = wp_create_nonce( 'connect' );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( 'init' );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( 'have permissions to authenticate', $e->getMessage() );
		}

		// Administrators can authenticate.
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$_GET['nonce'] = wp_create_nonce( 'connect' );
		$this->assertTrue( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( 'init' );
			$this->fail( 'Expected redirection to connect URL' );
		} catch ( RedirectException $e ) {
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth/', $e->get_location() );
		}

		// Additional scopes can be requested via the additional_scopes query parameter.
		$extra_scopes              = array( 'http://example.com/test/scope/a', 'http://example.com/test/scope/b' );
		$_GET['additional_scopes'] = $extra_scopes;
		try {
			do_action( 'init' );
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
