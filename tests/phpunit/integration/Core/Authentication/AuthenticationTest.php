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
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_Tag;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class AuthenticationTest extends TestCase {

	public function test_register() {
		remove_all_actions( 'init' );
		remove_all_actions( 'admin_head' );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_filters( 'googlesitekit_setup_data' );
		remove_all_filters( 'googlesitekit_admin_notices' );

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$auth->register();

		// Authentication::handle_oauth is invoked on init but we cannot test it due to use of filter_input.
		$this->assertTrue( has_action( 'init' ) );
		// Unable to test for sensitive scopes warning due to use of filter_input.
		$this->assertTrue( has_action( 'admin_head' ) );

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
				'googlesitekit_user_disconnected',
				'needs_reauthentication',
				'oauth_error',
			),
			array_filter( $notice_slugs )
		);
	}

	protected function assertAdminDataExtended() {
		$data = apply_filters( 'googlesitekit_admin_data', array() );

		$this->assertEqualSets(
			array(
				'connectURL',
				'disconnectURL',
				'proxySetupURL',
				'proxyPermissionsURL',
				'userData',
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
				'isFirstAdmin',
				'isSiteKitConnected',
				'isVerified',
				'moduleToSetup',
				'needReauthenticate',
				'requiredScopes',
				'showModuleSetupWizard',
			),
			array_keys( $data )
		);
	}

	public function test_register_head_verification_tags() {
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'login_head' );
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$auth->register();

		$tag_html = '<meta name="google-site-verification" content="test-verification-content">';
		set_transient( 'googlesitekit_verification_meta_tags', array( $tag_html ) );

		$this->assertContains(
			$tag_html,
			$this->capture_action( 'wp_head' )
		);

		$this->assertContains(
			$tag_html,
			$this->capture_action( 'login_head' )
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

	public function test_register_wp_login() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		remove_all_actions( 'wp_login' );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$auth    = new Authentication( $context );

		$auth->register();

		// Test authentication token is refreshed on login.
		$this->assertTrue( has_action( 'wp_login' ) );

		$client = $auth->get_oauth_client();
		// Fake authentication.
		$client->set_access_token( 'test-access-token', 123 );
		$this->assertTrue( $auth->is_authenticated() );
		// Set a refresh token and expect it to be passed to the Google Client.
		$client->set_refresh_token( 'test-refresh-token' );
		$mock_google_client = $this->getMock( 'Google_Client', array(
			'fetchAccessTokenWithRefreshToken',
			'revokeToken'
		) );
		$mock_google_client->expects( $this->once() )->method( 'fetchAccessTokenWithRefreshToken' )->with( 'test-refresh-token' );
		$mock_google_client->expects( $this->once() )->method( 'revokeToken' );
		$this->force_set_property( $client, 'google_client', $mock_google_client );

		// Force invalid_grant error to trigger disconnect.
		add_filter(
			'get_user_metadata',
			function ( $given, $object_id, $meta_key, $single ) use ( $context, $user_id ) {
				if ( $context->is_network_mode() ) {
					$error_meta_key = OAuth_Client::OPTION_ERROR_CODE;
				} else {
					$error_meta_key = $GLOBALS['wpdb']->get_blog_prefix() . OAuth_Client::OPTION_ERROR_CODE;
				}

				if ( (int) $object_id === (int) $user_id && $error_meta_key === $meta_key ) {
					return $single ? 'invalid_grant' : array( 'invalid_grant' );
				}

				return $given;
			},
			10,
			4
		);

		do_action( 'wp_login' );
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

	public function test_verification_tag() {
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf(
			'\Google\Site_Kit\Core\Authentication\Verification_Tag',
			$auth->verification_tag()
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

		$mock_google_client = $this->getMock( 'Google_Client', array( 'revokeToken' ) );
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
				'page'                  => 'googlesitekit-splash'
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
				'page'                     => 'googlesitekit-splash'
			),
			$params
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
			Verification_Tag::OPTION,
		);
	}
}
