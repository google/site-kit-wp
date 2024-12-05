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
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator_Interface;
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use WP_User;
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
		$this->assertEquals( 'Improve user engagement, trust and data privacy, while creating a simple, secure and personalized experience for your visitors', $this->module->description );
		$this->assertEquals( 10, $this->module->order );
	}

	public function test_render_signin_button() {
		$reset_site_url = site_url();
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );

		$this->module->register();
		$this->module->get_settings()->register();

		// Does not render the if the site is not https.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );
		$output = $this->capture_action( 'login_form' );
		$this->assertEmpty( $output );

		// Update site URL to https.
		$_SERVER['HTTPS'] = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if clientID is not set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		$output = $this->capture_action( 'login_form' );
		$this->assertEmpty( $output );

		$this->module->get_settings()->set( array( 'clientID' => null ) );
		$output = $this->capture_action( 'login_form' );
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
		$output = $this->capture_action( 'login_form' );

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

	public function test_handle_disconnect_user__bad_nonce() {
		$this->module->register();

		$_GET['nonce'] = 'bad-nonce';
		try {
			do_action( 'admin_action_' . Sign_In_With_Google::ACTION_DISCONNECT );
			$this->fail( 'Expected invalid nonce exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertEquals( $die_exception->getMessage(), 'The link you followed has expired.' );
		}
	}

	public function test_handle_disconnect_user__without_capability() {
		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$admin_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		update_user_option( $admin_id, Hashed_User_ID::OPTION, '111111' );
		wp_set_current_user( $editor_id );
		$_GET['user_id'] = $admin_id; // A user ID that is not the current user.
		$_GET['nonce']   = $this->create_disconnect_nonce( $admin_id );
		try {
			$this->module->handle_disconnect_user();
			$this->fail( 'Expected redirection to profile page' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( get_edit_user_link( $admin_id ), $redirect_url );
		}
		// Assert user was not disconnected.
		$this->assertEquals( '111111', get_user_option( Hashed_User_ID::OPTION, $admin_id ) );
	}

	public function test_handle_disconnect_user__can_disconnect_self() {
		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );

		$_GET['user_id'] = $editor_id;
		$_GET['nonce']   = $this->create_disconnect_nonce( $editor_id );
		try {
			$this->module->handle_disconnect_user();
			$this->fail( 'Expected redirection to profile page' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertStringStartsWith( get_edit_user_link( $editor_id ), $redirect_url );
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $redirect_params );
			$this->assertArrayHasKey( 'updated', $redirect_params );
		}
		$this->assertEmpty( get_user_option( Hashed_User_ID::OPTION, $editor_id ) );
	}

	public function test_handle_disconnect_user__admin_can_disconnect_other() {
		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$admin_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Multisite is more restrictive about editing other users, so we'll add the necessary cap.
		// See https://github.com/WordPress/WordPress/blob/9bc4fadffa05adc4bb72120bf335160639e46764/wp-includes/capabilities.php#L68
		if ( is_multisite() ) {
			( new WP_User( $admin_id ) )->add_cap( 'manage_network_users' );
		}

		update_user_option( $editor_id, Hashed_User_ID::OPTION, '222222' );
		wp_set_current_user( $admin_id );
		$_GET['user_id'] = $editor_id;
		$_GET['nonce']   = $this->create_disconnect_nonce( $editor_id );
		try {
			$this->module->handle_disconnect_user();
			$this->fail( 'Expected redirection to profile page' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertStringStartsWith( get_edit_user_link( $editor_id ), $redirect_url );
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $redirect_params );
			$this->assertArrayHasKey( 'updated', $redirect_params );
		}
		$this->assertEmpty( get_user_option( Hashed_User_ID::OPTION, $editor_id ) );
	}

	public function test_render_disconnect_profile() {
		$this->module->register();

		$user_id       = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$user_id_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Does not render the disconnect settings if the user meta is not set.
		wp_set_current_user( $user_id );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertEmpty( $output );

		// Should render the disconnect settings on the users own profile for editors and admins.
		update_user_option( $user_id, Hashed_User_ID::OPTION, '111111' );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'You can sign in with your Google account.', $output );

		update_user_option( $user_id_admin, Hashed_User_ID::OPTION, '222222' );
		wp_set_current_user( $user_id_admin );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'You can sign in with your Google account.', $output );

		if ( is_multisite() ) {
			return; // TODO: The below results in an empty output on multisite.
		}

		// Should render the disconnect settings for other user if user is an admin.
		wp_set_current_user( $user_id_admin );
		$output = $this->capture_action( 'edit_user_profile', get_user_by( 'id', $user_id ) );
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

	protected function create_disconnect_nonce( $user_id ) {
		return wp_create_nonce( Sign_In_With_Google::ACTION_DISCONNECT . '-' . $user_id );
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
