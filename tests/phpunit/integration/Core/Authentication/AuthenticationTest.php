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
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\User_Input_State;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\User_Input_Settings;
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
		$this->assertTrue( has_action( 'admin_action_' . Google_Proxy::ACTION_SETUP ) );
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
				'oauth_error',
				'reconnect_after_url_mismatch',
			),
			array_filter( $notice_slugs )
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
				'userInputState',
				'verified',
			),
			array_keys( $user_data )
		);

		// When a profile is set, additional data is added.
		$email = 'wapuu.wordpress@gmail.com';
		$photo = 'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png';
		$auth->profile()->set( compact( 'email', 'photo' ) );
		$user_data = apply_filters( 'googlesitekit_user_data', array() );
		$this->assertEqualSets(
			array(
				'connectURL',
				'initialVersion',
				'userInputState',
				'verified',
				'user',
			),
			array_keys( $user_data )
		);
		$this->assertEquals( $email, $user_data['user']['email'] );
		$this->assertEquals( $photo, $user_data['user']['picture'] );
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

		// We cannot test that the hook has not been added to 'googlesitekit_authorize_user'
		// since the `register` method also adds another unrelated callback to it unconditionally.
		// That should be fine though since we're covering the integration below.
		$this->assertFalse( has_action( 'googlesitekit_reauthorize_user' ) );

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
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$credentials  = new Credentials( new Encrypted_Options( new Options( $context ) ) );
		$auth         = new Authentication( $context );
		$google_proxy = $auth->get_google_proxy();

		$auth->register();

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

	public function test_require_user_input() {
		$this->enable_feature( 'userInput' );
		remove_all_actions( 'googlesitekit_authorize_user' );
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$auth->register();

		$user_input_state = $this->force_get_property( $auth, 'user_input_state' );
		// Mocking User_Input_Settings here to avoid adding a ton of complexity
		// from intercepting a request to the proxy, returning, settings etc.
		$mock_user_input_settings = $this->getMockBuilder( User_Input_Settings::class )
			->disableOriginalConstructor()
			->disableProxyingToOriginalMethods()
			->setMethods( array( 'set_settings' ) )
			->getMock();
		$this->force_set_property( $auth, 'user_input_settings', $mock_user_input_settings );

		$this->assertEmpty( $user_input_state->get() );
		do_action( 'googlesitekit_authorize_user', array(), array(), array() );
		$this->assertEquals( User_Input_State::VALUE_REQUIRED, $user_input_state->get() );
	}

	public function test_user_input_not_triggered() {
		$this->enable_feature( 'userInput' );
		remove_all_actions( 'googlesitekit_authorize_user' );
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$auth->register();

		$user_input_state = $this->force_get_property( $auth, 'user_input_state' );
		// Mocking User_Input_Settings here to avoid adding a ton of complexity
		// from intercepting a request to the proxy, returning, settings etc.
		$mock_user_input_settings = $this->getMockBuilder( User_Input_Settings::class )
			->disableOriginalConstructor()
			->disableProxyingToOriginalMethods()
			->setMethods( array( 'set_settings' ) )
			->getMock();
		$this->force_set_property( $auth, 'user_input_settings', $mock_user_input_settings );

		$this->assertEmpty( $user_input_state->get() );

		$mock_scopes = array(
			'openid',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/siteverification',
			'https://www.googleapis.com/auth/webmasters',
			'https://www.googleapis.com/auth/analytics.readonly',
		);

		$mock_previous_scopes = array(
			'openid',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/siteverification',
			'https://www.googleapis.com/auth/webmasters',
		);
		do_action( 'googlesitekit_authorize_user', array(), $mock_scopes, $mock_previous_scopes );
		$this->assertEmpty( $user_input_state->get() );
	}

	public function test_require_user_input__without_feature() {
		remove_all_actions( 'googlesitekit_authorize_user' );
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$auth->register();

		$user_input_state = $this->force_get_property( $auth, 'user_input_state' );
		// Mocking User_Input_Settings here to avoid adding a ton of complexity
		// from intercepting a request to the proxy, returning, settings etc.
		$mock_user_input_settings = $this->getMockBuilder( User_Input_Settings::class )
			->setMethods( array( 'set_settings' ) )
			->disableProxyingToOriginalMethods()
			->disableOriginalConstructor()
			->getMock();
		$this->force_set_property( $auth, 'user_input_settings', $mock_user_input_settings );

		$this->assertEmpty( $user_input_state->get() );
		do_action( 'googlesitekit_authorize_user', array(), array(), array() );
		$this->assertEmpty( $user_input_state->get() );
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
			$this->assertEquals( 'Invalid nonce.', $e->getMessage() );
		}

		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );

		// Requires authenticate permissions.
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( 'have permissions to authenticate', $e->getMessage() );
		}

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_CONNECT );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $connect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( 'have permissions to authenticate', $e->getMessage() );
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
			$this->assertEquals( 'Invalid nonce.', $e->getMessage() );
		}

		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );

		// Requires authenticate permissions.
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( 'have permissions to authenticate', $e->getMessage() );
		}

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$_GET['nonce'] = wp_create_nonce( Authentication::ACTION_DISCONNECT );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );
		try {
			do_action( $disconnect_action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( WPDieException $e ) {
			$this->assertContains( 'have permissions to authenticate', $e->getMessage() );
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

		$this->assertEquals( Google_Proxy::ACTION_SETUP, $args['action'] );
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
		$this->force_set_property( $authentication->get_oauth_client(), 'access_token', 'valid-auth-token' );

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

	public function test_handle_sync_site_fields() {
		remove_all_actions( 'admin_action_' . Google_Proxy::ACTION_SETUP );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$options           = new Options( $context );
		$user_options      = new User_Options( $context );
		$encrypted_options = new Encrypted_Options( $options );

		$authentication = new Authentication( $context, $options, $user_options );
		$authentication->register();

		// Emulate credentials.
		$fake_proxy_credentials = $this->fake_proxy_site_connection();

		// Ensure admin user has Permissions::SETUP cap regardless of authentication.
		add_filter(
			'user_has_cap',
			function( $caps ) {
				$caps[ Permissions::SETUP ] = true;
				return $caps;
			}
		);

		$_GET['nonce']              = wp_create_nonce( Google_Proxy::ACTION_SETUP );
		$_GET['googlesitekit_code'] = 'test-code';

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_SETUP );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/site-management/setup/', $location );

			$parsed = wp_parse_url( $location );
			parse_str( $parsed['query'], $query_args );

			$this->assertEquals( $fake_proxy_credentials['client_id'], $query_args['site_id'] );
			$this->assertEquals( 'test-code', $query_args['code'] );
		}
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
		$authentication->get_oauth_client()->set_access_token( 'test-access-token', 3600 );
		$authentication->register();

		// Requires 'googlesitekit_proxy_permissions' nonce.
		try {
			do_action( $action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( Exception $e ) {
			$this->assertEquals( 'Invalid nonce.', $e->getMessage() );
		}

		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_PERMISSIONS );
		$this->assertFalse( current_user_can( Permissions::AUTHENTICATE ) );

		// Requires Site Kit Authenticate permissions
		try {
			do_action( $action );
			$this->fail( 'Expected WPDieException to be thrown' );
		} catch ( Exception $e ) {
			$this->assertContains( 'insufficient permissions to manage Site Kit permissions', $e->getMessage() );
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
			$this->assertContains( 'Site Kit is not configured to use the authentication proxy', $e->getMessage() );
		}

		$fake_proxy_credentials = $this->fake_proxy_site_connection();

		try {
			do_action( $action );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/site-management/permissions/', $location );

			$parsed = wp_parse_url( $location );
			parse_str( $parsed['query'], $query_args );

			$this->assertEquals( $fake_proxy_credentials['client_id'], $query_args['site_id'] );
		}
	}

	public function test_filter_features_via_proxy() {
		remove_all_filters( 'googlesitekit_is_feature_enabled' );

		$this->fake_proxy_site_connection();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new Authentication( $context );
		$google_proxy   = $authentication->get_google_proxy();

		$this->assertFalse( has_filter( 'googlesitekit_is_feature_enabled' ) );
		$authentication->register();
		$this->assertTrue( has_filter( 'googlesitekit_is_feature_enabled' ) );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $google_proxy ) {
				if ( $google_proxy->url( Google_Proxy::FEATURES_URI ) !== $url ) {
					return $preempt;
				}

				$data = array(
					'userInput'             => array( 'enabled' => true ),
					'widgets.dashboard'     => array( 'enabled' => true ),
					'widgets.pageDashboard' => array( 'enabled' => false ),
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

		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', false, 'nonExisting' ) );
		$this->assertTrue( apply_filters( 'googlesitekit_is_feature_enabled', false, 'widgets.dashboard' ) );
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', false, 'widgets.pageDashboard' ) );
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
