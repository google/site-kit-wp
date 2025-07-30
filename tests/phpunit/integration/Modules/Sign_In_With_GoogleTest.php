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
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator_Interface;
use Google\Site_Kit\Modules\Sign_In_With_Google\Existing_Client_ID;
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
		$this->assertEquals( Sign_In_With_Google::MODULE_SLUG, $this->module->slug, 'Module slug should match constant.' );
		$this->assertEquals( 'Sign in with Google', $this->module->name, 'Module name should be correct.' );
		$this->assertEquals( 'https://developers.google.com/identity/gsi/web/guides/overview', $this->module->homepage, 'Module homepage should be correct.' );
		$this->assertEquals( 'Improve user engagement, trust and data privacy, while creating a simple, secure and personalized experience for your visitors', $this->module->description, 'Module description should be correct.' );
		$this->assertEquals( 10, $this->module->order, 'Module order should be correct.' );
	}

	public function test_render_signinwithgoogle() {
		$reset_site_url = site_url();
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );
		remove_action( 'wp_footer', 'the_block_template_skip_link' );

		$this->module->register();
		$this->module->get_settings()->register();

		// Does not render the if the site is not https.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );
		$output = $this->capture_action( 'wp_footer' );
		$this->assertStringNotContainsString( 'Sign in with Google button added by Site Kit', $output, 'Button should not render if site is not https.' );

		// Update site URL to https.
		$_SERVER['HTTPS']       = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		$_SERVER['SCRIPT_NAME'] = wp_login_url(); // Required because is_login() uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if clientID is not set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		$output = $this->capture_action( 'wp_footer' );
		$this->assertStringNotContainsString( 'Sign in with Google button added by Site Kit', $output, 'Button should not render if clientID is not set.' );

		$this->module->get_settings()->set( array( 'clientID' => null ) );
		$output = $this->capture_action( 'wp_footer' );
		$this->assertStringNotContainsString( 'Sign in with Google button added by Site Kit', $output, 'Button should not render if clientID is null.' );

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
		$output = $this->capture_action( 'wp_footer' );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Button should render with correct clientID and redirect_uri.' );

		$this->assertStringContainsString( "client_id:'1234567890.googleusercontent.com'", $output, 'Rendered output should contain correct client_id.' );
		$this->assertStringContainsString( "fetch('https://example.com/wp-login.php?action=googlesitekit_auth'", $output, 'Rendered output should contain correct fetch URL.' );

		$this->assertStringContainsString( sprintf( '"text":"%s"', Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'] ), $output, 'Rendered output should contain correct text.' );
		$this->assertStringContainsString( sprintf( '"theme":"%s"', Sign_In_With_Google_Settings::THEME_LIGHT['value'] ), $output, 'Rendered output should contain correct theme.' );
		$this->assertStringContainsString( sprintf( '"shape":"%s"', Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'] ), $output, 'Rendered output should contain correct shape.' );

		// The Sign in with Google JS should always render, even on the front
		// page.
		$_SERVER['SCRIPT_NAME'] = '/index.php';
		$output                 = $this->capture_action( 'wp_footer' );

		// The button shouldn't be rendered on a non-login page.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Button should render on non-login page if One Tap is enabled.' );

		// Enable the Sign in with Google One Tap on all pages.
		$this->module->get_settings()->set(
			array(
				'clientID'         => '1234567890.googleusercontent.com',
				'text'             => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'            => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
				'shape'            => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
				'oneTapEnabled'    => true,
				'oneTapOnAllPages' => true,
			)
		);

		// Now the button should be rendered on a non-login page.
		$output = $this->capture_action( 'wp_footer' );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Button should render on non-login page.' );

		// Revert home and siteurl and https value.
		update_option( 'home', $reset_site_url );
		update_option( 'siteurl', $reset_site_url );
		unset( $_SERVER['HTTPS'] );
		unset( $_SERVER['SCRIPT_NAME'] );
		add_action( 'wp_footer', 'the_block_template_skip_link' );
	}

	public function test_render_signinwithgoogle__woocommerce_active() {
		// Re-instantiate the class so its "is_woocommerce_active" property is recalculated
		// using the updated, filtered active_plugins. Otherwise, it would use the old cached value.
		$this->module = new Sign_In_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() ) );

		$this->module->register();
		$this->module->get_settings()->register();

		$this->module->get_settings()->set(
			array(
				'clientID' => '1234567890.googleusercontent.com',
				'text'     => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'    => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
				'shape'    => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			)
		);

		// Render the button in the WooCommerce form.
		$woo_output = $this->capture_action( 'woocommerce_login_form_start' );

		// Check the render button contains the expected class name.
		$this->assertStringContainsString( 'woocommerce-form-row', $woo_output, 'WooCommerce form should contain the correct class.' );
	}

	public function test_render_button_in_wp_login_form() {
		$reset_site_url = site_url();
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );

		$this->module->register();
		$this->module->get_settings()->register();

		// Does not render the if the site is not https.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringNotContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should not render in login form if site is not https.' );

		// Update site URL to https.
		$_SERVER['HTTPS']       = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		$_SERVER['SCRIPT_NAME'] = wp_login_url(); // Required because is_login() uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if clientID is not set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringNotContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should not render in login form if clientID is not set.' );

		$this->module->get_settings()->set( array( 'clientID' => null ) );
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringNotContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should not render in login form if clientID is null.' );

		// Renders the button with the correct clientID and redirect_uri.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );

		// Render the button.
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should render in login form with correct clientID.' );
	}

	public function test_handle_disconnect_user__bad_nonce() {
		$this->module->register();

		$_GET['nonce'] = 'bad-nonce';
		try {
			do_action( 'admin_action_' . Sign_In_With_Google::ACTION_DISCONNECT );
			$this->fail( 'Expected invalid nonce exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertEquals( $die_exception->getMessage(), 'The link you followed has expired.', 'Should die with expired link message for bad nonce.' );
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
			$this->assertEquals( get_edit_user_link( $admin_id ), $redirect_url, 'Should redirect to profile page if user cannot disconnect another.' );
		}
		// Assert user was not disconnected.
		$this->assertEquals( '111111', get_user_option( Hashed_User_ID::OPTION, $admin_id ), 'User should not be disconnected if not allowed.' );
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
			$this->assertStringStartsWith( get_edit_user_link( $editor_id ), $redirect_url, 'Should redirect to profile page after disconnecting self.' );
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $redirect_params );
			$this->assertArrayHasKey( 'updated', $redirect_params, 'Redirect params should contain updated key.' );
			$this->assertEmpty( get_user_option( Hashed_User_ID::OPTION, $editor_id ), 'User option should be empty after disconnecting self.' );
		}
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
			$this->assertStringStartsWith( get_edit_user_link( $editor_id ), $redirect_url, 'Admin should be able to disconnect other users.' );
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $redirect_params );
			$this->assertArrayHasKey( 'updated', $redirect_params, 'Redirect params should contain updated key for admin disconnect.' );
			$this->assertEmpty( get_user_option( Hashed_User_ID::OPTION, $editor_id ), 'User option should be empty after admin disconnect.' );
		}
	}

	public function test_render_disconnect_profile() {
		$this->module->register();

		$user_id       = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$user_id_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Does not render the disconnect settings if the user meta is not set.
		wp_set_current_user( $user_id );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertEmpty( $output, 'Disconnect settings should not render if user meta is not set.' );

		// Should render the disconnect settings on the users own profile for editors and admins.
		update_user_option( $user_id, Hashed_User_ID::OPTION, '111111' );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'You can sign in with your Google account.', $output, 'Disconnect settings should render for user profile.' );

		update_user_option( $user_id_admin, Hashed_User_ID::OPTION, '222222' );
		wp_set_current_user( $user_id_admin );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'You can sign in with your Google account.', $output, 'Disconnect settings should render for admin profile.' );

		if ( is_multisite() ) {
			return; // TODO: The below results in an empty output on multisite.
		}

		// Should render the disconnect settings for other user if user is an admin.
		wp_set_current_user( $user_id_admin );
		$output = $this->capture_action( 'edit_user_profile', get_user_by( 'id', $user_id ) );
		$this->assertStringContainsString( 'This user can sign in with their Google account.', $output, 'Disconnect settings should render for other user if admin.' );
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
			$this->assertEquals( $redirect_uri, $e->get_location(), 'Should redirect to provided URI for POST method.' );
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
					->setMethods( array( 'authenticate_user' ) )
					->getMock();
		$mock->method( 'authenticate_user' )->willReturn( $redirect_to );

		return $mock;
	}

	public function test_on_deactivation__persists_client_id() {
		$this->module->register();
		$this->module->get_settings()->register();

		$test_settings = array( 'clientID' => 'test_client_id.apps.googleusercontent.com' );
		$this->module->get_settings()->merge( $test_settings );

		$this->assertOptionNotExists( Existing_Client_ID::OPTION );
		$this->module->on_deactivation();
		$this->assertEquals( 'test_client_id.apps.googleusercontent.com', get_option( Existing_Client_ID::OPTION ), 'Client ID should persist on deactivation.' );
	}

	public function test_inline_data_has_woocommerce() {
		$this->module->register();
		$this->module->get_settings()->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals( false, $inline_modules_data['sign-in-with-google']['isWooCommerceActive'], 'Inline data should indicate WooCommerce is not active.' );
		$this->assertEquals( false, $inline_modules_data['sign-in-with-google']['isWooCommerceRegistrationEnabled'], 'Inline data should indicate WooCommerce registration is not enabled.' );
	}

	public function test_inline_data_with_no_existing_client_id() {
		$this->module->register();
		$this->module->get_settings()->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayNotHasKey( 'existingClientID', $inline_modules_data['sign-in-with-google'], 'Inline data should not have existingClientID if not set.' );
	}

	public function test_inline_data_with_existing_client_id() {
		$this->module->register();
		$this->module->get_settings()->register();

		update_option( Existing_Client_ID::OPTION, 'test_client_id.apps.googleusercontent.com' );

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals( 'test_client_id.apps.googleusercontent.com', $inline_modules_data['sign-in-with-google']['existingClientID'], 'Inline data should have correct existingClientID if set.' );
	}
}
