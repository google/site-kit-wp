<?php
/**
 * Sign_In_With_GoogleTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator_Interface;
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google_Client;
use WP_Error;
use WP_Query;
use WPDieException;

/**
 * @group Modules
 */
class Sign_In_With_GoogleTest extends TestCase {

	/**
	 * Sign_In_With_Google object.
	 *
	 * @var Sign_In_With_Google
	 */
	private $module;

	/**
	 * The original $_SERVER data.
	 *
	 * @var array
	 */
	private $server_data;

	public function set_up() {
		parent::set_up();

		// Store the original $_SERVER data.
		$this->server_data = $_SERVER;
		$this->module      = new Sign_In_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() ) );
	}

	public function tear_down() {
		parent::tear_down();

		// Restore the original $_SERVER data.
		$_SERVER = $this->server_data;
	}

	public function test_magic_methods() {
		$this->assertEquals( Sign_In_With_Google::MODULE_SLUG, $this->module->slug );
		$this->assertEquals( 'Sign in with Google', $this->module->name );
		$this->assertEquals( 'https://developers.google.com/identity/gsi/web/guides/overview', $this->module->homepage );
		$this->assertEquals( 'Improve user engagement, trust, and data privacy, while creating a simple, secure, and personalized experience for your visitors', $this->module->description );
		$this->assertEquals( 10, $this->module->order );
	}

	public function test_handle_google_auth() {
		global $wp_query;
		$this->module->register();

		$user_options             = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$user_connection_meta_key = $user_options->get_meta_key( Hashed_User_ID::OPTION );

		$wp_query = new WP_Query();
		$wp_query->query( array( 'google_auth' => 123 ) );

		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );

		$mock_input = $this->getMockBuilder( Input::class )
			->setMethods( array( 'filter' ) )
			->getMock();
		$mock_input->method( 'filter' )
			->willReturnCallback(
				function ( $input ) {
					if ( INPUT_SERVER === $input ) {
						return 'GET';
					}
					return null;
				}
			);
		$this->force_set_property( $this->module, 'context', new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, $mock_input ) );

		// Should return null if the Request Method is not POST.
		$this->assertNull( $this->module->handle_google_auth() );

		// Should redirect to login with error google_auth_invalid_g_csrf_token if csrf tokens don't match.
		$mock_input = $this->getMockBuilder( Input::class )
			->setMethods( array( 'filter' ) )
			->getMock();
		$mock_input->method( 'filter' )
			->willReturnCallback(
				function ( $input ) {
					if ( INPUT_SERVER === $input ) {
						return 'POST';
					}
					if ( INPUT_COOKIE === $input ) {
						return '11111';
					}
					if ( INPUT_POST === $input ) {
						return '99999';
					}
					return null;
				}
			);
		$this->force_set_property( $this->module, 'context', new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, $mock_input ) );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error google_auth_invalid_g_csrf_token' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_invalid_g_csrf_token', $params['error'] );
		}

		// Should redirect to login with error google_auth_invalid_request verify throws and Exception.
		$mock_input = $this->getMockBuilder( Input::class )
			->setMethods( array( 'filter' ) )
			->getMock();
		$mock_input->method( 'filter' )
			->willReturnCallback(
				function ( $input ) {
					if ( INPUT_SERVER === $input ) {
						return 'POST';
					}
					if ( INPUT_COOKIE === $input ) {
						return '11111';
					}
					if ( INPUT_POST === $input ) {
						return '11111';
					}
					return null;
				}
			);
		$this->force_set_property( $this->module, 'context', new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, $mock_input ) );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
			->willReturnCallback(
				function () {
					throw new Exception();
				}
			);
		$this->force_set_property( $this->module, 'google_client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error google_auth_invalid_request' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_invalid_request', $params['error'] );
		}

		// Should redirect with google_auth_invalid_request error if payload is missing email.
		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'         => '1111111111',
				'name'        => '',
				'given_name'  => '',
				'family_name' => '',
			)
		);
		$this->force_set_property( $this->module, 'google_client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error google_auth_invalid_request' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_invalid_request', $params['error'] );
		}

		// Should redirect with google_auth_invalid_request error if payload is missing sub.
		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn( array( 'email' => 'testemail@example.com' ) );
		$this->force_set_property( $this->module, 'google_client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error google_auth_invalid_request' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_invalid_request', $params['error'] );
		}

		// Should login existing user with matching Google user ID.
		$wp_user = $this->factory()->user->create_and_get(
			array(
				'user_login' => 'testuser',
				'user_email' => 'testsiwg@example.com',
			)
		);
		add_user_meta( $wp_user->ID, $user_connection_meta_key, hash( 'sha256', '1111111111' ), true );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'         => '1111111111',
				'email'       => 'testsiwg@example.com',
				'name'        => 'Full Name',
				'given_name'  => 'Full',
				'family_name' => 'Name',
			)
		);
		$this->force_set_property( $this->module, 'google_client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected successful login redirection' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( 'http://example.org/wp-admin/profile.php', $redirect_url );
		}

		$this->assertEquals( $wp_user->ID, get_current_user_id() );
		$this->assertEquals( hash( 'sha256', '1111111111' ), get_user_meta( get_current_user_id(), $user_connection_meta_key, true ) );
		$this->assertEquals( 1, did_action( 'wp_login' ) );
		wp_logout();

		// Should login existing user with matching Google ID regardless of email.
		$wp_user1 = $this->factory()->user->create_and_get(
			array(
				'user_login'  => 'testuser1',
				'user_email'  => 'testsiwg1@example.com',
				'name'        => 'Full Name',
				'given_name'  => 'Full',
				'family_name' => 'Name',
			)
		);
		add_user_meta( $wp_user1->ID, $user_connection_meta_key, hash( 'sha256', '2222222222' ), true );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'         => '2222222222',
				'email'       => 'testsiwgdifferentemail@example.com',
				'name'        => 'Full Name',
				'given_name'  => 'Full',
				'family_name' => 'Name',
			)
		);
		$this->force_set_property( $this->module, 'google_client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected successful login redirection' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( 'http://example.org/wp-admin/profile.php', $redirect_url );
		}

		$this->assertEquals( $wp_user1->ID, get_current_user_id() );
		$this->assertEquals( hash( 'sha256', '2222222222' ), get_user_meta( get_current_user_id(), $user_connection_meta_key, true ) );
		wp_logout();

		// Creates new user if "Anyone can register" setting is enabled.
		if ( is_multisite() ) {
			update_site_option( 'registration', 'user' );
		}
		update_option( 'users_can_register', true );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'         => '3333333333',
				'email'       => 'testsiwg3@example.com',
				'name'        => 'Full Name',
				'given_name'  => 'Full',
				'family_name' => 'Name',
			)
		);
		$this->force_set_property( $this->module, 'google_client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected successful login redirection' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( 'http://example.org/wp-admin/profile.php', $redirect_url );
		}

		// Check all user settings are set as expected.
		$new_user = get_user_by( 'email', 'testsiwg3@example.com' );
		$this->assertEquals( 'fullname', $new_user->user_login );
		$this->assertEquals( 'fullname', $new_user->display_name );
		$this->assertEquals( 'testsiwg3@example.com', $new_user->user_email );
		$this->assertEquals( 'Full', $new_user->nickname );
		$this->assertEquals( 'Full', $new_user->first_name );
		$this->assertEquals( 'Name', $new_user->last_name );
		$this->assertEquals( hash( 'sha256', '3333333333' ), get_user_meta( get_current_user_id(), $user_connection_meta_key, true ) );

		// Does not create new user if "Anyone can register" setting is disabled and will redirect to login with error user_actions_failed.
		if ( is_multisite() ) {
			// Note: on multisite, the registration site option overrides the site level option.
			update_site_option( 'registration', 'none' );
		}
		update_option( 'users_can_register', false );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'         => '4444444444',
				'email'       => 'testsiwg4@example.com',
				'name'        => 'Full Name',
				'given_name'  => 'Full',
				'family_name' => 'Name',
			)
		);
		$this->force_set_property( $this->module, 'google_client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error registration_disabled' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_failed', $params['error'] );
		}
		// Check the user was not created and the meta not stored.
		$this->assertFalse( get_user_by( 'email', 'testsiwg4@example.com' ) );
		$matching_user = get_users(
			array(
				'meta_key'   => $user_connection_meta_key,
				'meta_value' => hash( 'sha256', '4444444444' ),
				'number'     => 1,
			)
		);
		$this->assertEmpty( $matching_user );
		wp_logout();

		wp_delete_user( $wp_user->ID );
		wp_delete_user( $wp_user1->ID );
		wp_delete_user( $new_user->ID );
	}
	private function render_by_action( $action, $arg = null ) {
		ob_start();
		do_action( $action, $arg );
		$output = ob_get_contents();
		ob_end_clean();
		return $output;
	}

	public function test_render_signin_button() {
		$reset_site_url = site_url();
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );

		$this->module->register();
		$this->module->get_settings()->register();

		// Does not render the if the site is not https.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );
		$output = $this->render_by_action( 'login_form' );
		$this->assertEmpty( $output );

		// Update site URL to https.
		$_SERVER['HTTPS'] = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if clientID is not set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		$output = $this->render_by_action( 'login_form' );
		$this->assertEmpty( $output );

		$this->module->get_settings()->set( array( 'clientID' => null ) );
		$output = $this->render_by_action( 'login_form' );
		$this->assertEmpty( $output );

		// Renders the button with the correct clientID and redirect_uri.
		$this->module->get_settings()->set(
			array(
				'clientID' => '1234567890.googleusercontent.com',
				'text'     => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'    => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
				'shape'    => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			)
		);

		// Render the button.
		$output = $this->render_by_action( 'login_form' );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );

		$this->assertStringContainsString( "client_id: '1234567890.googleusercontent.com'", $output );
		$this->assertStringContainsString( "fetch( 'https://example.com/wp-login.php?action=googlesitekit_auth'", $output );

		$this->assertStringContainsString( sprintf( '"text":"%s"', Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'] ), $output );
		$this->assertStringContainsString( sprintf( '"theme":"%s"', Sign_In_With_Google_Settings::THEME_LIGHT['value'] ), $output );
		$this->assertStringContainsString( sprintf( '"shape":"%s"', Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'] ), $output );

		// Revert home and siteurl and https value.
		update_option( 'home', $reset_site_url );
		update_option( 'siteurl', $reset_site_url );
		unset( $_SERVER['HTTPS'] );
	}

	public function test_handle_disconnect_user() {
		$this->module->register();

		$user_options             = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$user_connection_meta_key = $user_options->get_meta_key( User_Connection_Setting::OPTION );

		// Invalid nonce should return error.
		$_GET['nonce'] = 'bad-nonce';
		try {
			do_action( 'admin_action_' . Sign_In_With_Google::DISCONNECT_ACTION );
			$this->fail( 'Expected invalid nonce exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertEquals( $die_exception->getMessage(), 'The link you followed has expired.' );
		}

		// Returns null if no user ID is passed.
		$this->assertEmpty( $this->module->handle_disconnect_user( wp_create_nonce( Sign_In_With_Google::DISCONNECT_ACTION ) ) );

		// Does not delete user meta if the user is not an admin and is not updating their own user.
		$user_id       = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$user_id_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		add_user_meta( $user_id, $user_connection_meta_key, '111111' );
		$_REQUEST['user_id'] = $user_id_admin; // A user ID that is not the current user.

		try {
			$this->module->handle_disconnect_user( wp_create_nonce( Sign_In_With_Google::DISCONNECT_ACTION ) );
			$this->fail( 'Expected redirection to profile page' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( get_edit_user_link( $user_id_admin ), $redirect_url );
		}
		$this->assertEquals( '111111', get_user_meta( $user_id, $user_connection_meta_key, true ) );

		// Deletes user meta if a non admin is updating their own user.
		$_REQUEST['user_id'] = $user_id;
		try {
			$this->module->handle_disconnect_user( wp_create_nonce( Sign_In_With_Google::DISCONNECT_ACTION ) );
			$this->fail( 'Expected redirection to profile page' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( get_edit_user_link( $user_id ), $redirect_url );
		}
		$this->assertEmpty( get_user_meta( $user_id, $user_connection_meta_key, true ) );

		// Deletes user meta if user is an admin.
		add_user_meta( $user_id, $user_connection_meta_key, '222222' );
		wp_set_current_user( $user_id_admin );
		try {
			$this->module->handle_disconnect_user( wp_create_nonce( Sign_In_With_Google::DISCONNECT_ACTION ) );
			$this->fail( 'Expected redirection to profile page' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( get_edit_user_link( $user_id ), $redirect_url );
		}
		$this->assertEmpty( get_user_meta( $user_id, $user_connection_meta_key, true ) );
	}

	public function test_render_disconnect_profile() {
		$this->module->register();

		$user_options             = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$user_connection_meta_key = $user_options->get_meta_key( User_Connection_Setting::OPTION );

		$user_id       = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$user_id_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Does not render the disconnect settings if the user meta is not set.
		wp_set_current_user( $user_id );
		$output = $this->render_by_action( 'show_user_profile', wp_get_current_user() );
		$this->assertEmpty( $output );

		// Should render the disconnect settings on the users own profile for editors and admins.
		add_user_meta( $user_id, $user_connection_meta_key, '111111' );
		$output = $this->render_by_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'This user can sign in with their Google account.', $output );

		add_user_meta( $user_id_admin, $user_connection_meta_key, '222222' );
		wp_set_current_user( $user_id_admin );
		$output = $this->render_by_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'This user can sign in with their Google account.', $output );

		// Should render the disconnect settings for other user if user is an admin.
		wp_set_current_user( $user_id_admin );
		$output = $this->render_by_action( 'edit_user_profile', get_user_by( 'id', $user_id ) );
		$this->assertStringContainsString( 'This user can sign in with their Google account.', $output );
	}

	private function call_handle_auth_callback( $authenticator ) {
		$class  = new \ReflectionClass( Sign_In_With_Google::class );
		$method = $class->getMethod( 'handle_auth_callback' );
		$method->setAccessible( true );

		return $method->invokeArgs( $this->module, array( $authenticator ) );
	}

	public function test_handle_auth_callback_should_not_redirect_for_non_post_method() {
		try {
			$_SERVER['REQUEST_METHOD'] = 'GET';
			$this->call_handle_auth_callback( $this->get_mock_authenticator( 'https://example.com' ) );
			$this->expectNotToPerformAssertions();
		} catch ( RedirectException $e ) {
			$this->fail( 'Expected no redirection' );
		}
	}

	public function test_handle_auth_callback_should_redirect_for_post_method() {
		$redirect_uri              = home_url( '/test-page/' );
		$_SERVER['REQUEST_METHOD'] = 'POST';

		try {
			$this->call_handle_auth_callback( $this->get_mock_authenticator( $redirect_uri ) );
			$this->fail( 'Expected to redirect' );
		} catch ( RedirectException $e ) {
			$this->assertEquals( $redirect_uri, $e->get_location() );
		}
	}

	/**
	 * @param $redirect_to string
	 * @return Authenticator_Interface
	 */
	protected function get_mock_authenticator( $redirect_to ) {
		$mock = $this->getMockBuilder( Authenticator_Interface::class )
					->onlyMethods( array( 'authenticate_user' ) )
					->getMock();
		$mock->method( 'authenticate_user' )->willReturn( $redirect_to );

		return $mock;
	}
}
