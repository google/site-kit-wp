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
	private static $server_data = array();

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$server_data = $_SERVER;
	}

	public function set_up() {
		parent::set_up();

		$this->module = new Sign_In_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() ) );
	}

	public function tear_down() {
		parent::tear_down();

		$_SERVER = self::$server_data;
	}

	public function test_magic_methods() {
		$this->assertEquals( Sign_In_With_Google::MODULE_SLUG, $this->module->slug, 'Module slug should match constant.' );
		$this->assertEquals( 'Sign in with Google', $this->module->name, 'Module name should match.' );
		$this->assertEquals( 'https://developers.google.com/identity/gsi/web/guides/overview', $this->module->homepage, 'Module homepage should match expected URL.' );
		$this->assertEquals( 'Improve user engagement, trust and data privacy, while creating a simple, secure and personalized experience for your visitors', $this->module->description, 'Module description should match expected text.' );
		$this->assertEquals( 10, $this->module->order, 'Module order should be 10.' );
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
		$this->assertStringContainsString( 'woocommerce-form-row', $woo_output, 'WooCommerce output should contain expected form row class.' );
	}

	public function test_render_button_in_wp_login_form() {
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );

		$this->module->register();
		$this->module->get_settings()->register();

		// Does not render the if the site is not https.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringNotContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should not render when site is not HTTPS.' );

		// Update site URL to https.
		$_SERVER['HTTPS']       = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		$_SERVER['SCRIPT_NAME'] = wp_login_url(); // Required because is_login() uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if clientID is not set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringNotContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should not render when clientID is empty.' );

		$this->module->get_settings()->set( array( 'clientID' => null ) );
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringNotContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should not render when clientID is null.' );

		// Renders the button with the correct clientID and redirect_uri.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );

		// Render the button.
		$output = apply_filters( 'login_form_top', '' );
		$this->assertStringContainsString( '<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>', $output, 'Button should render when HTTPS and clientID set.' );
	}

	public function test_render_button_in_wp_comments() {
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );

		// Navigate to a singular post.
		$post_id = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );

		$this->module->register();
		$this->module->get_settings()->register();

		// Does not render the if the site does not allow users to register.
		$this->module->get_settings()->set(
			array(
				'clientID'                  => '1234567890.googleusercontent.com',
				'showNextToCommentsEnabled' => true,
			)
		);
		update_option( 'users_can_register', false );
		$output = apply_filters( 'comment_form_after_fields', '' );
		$this->assertNull( $output, 'Button should not render when site does not have open user registration.' );

		// Update site URL to https.
		$_SERVER['HTTPS']       = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		$_SERVER['SCRIPT_NAME'] = wp_login_url(); // Required because is_login() uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if Show next to comments is not enabled.
		$this->module->get_settings()->set(
			array(
				'clientID'                  => '1234567890.googleusercontent.com',
				'showNextToCommentsEnabled' => false,
			)
		);
		update_option( 'users_can_register', true );
		$output = apply_filters( 'comment_form_after_fields', '' );
		$this->assertNull( $output, 'Button should not render when Show next to comments is not enabled.' );

		// Renders the button when both open user registration and the Show
		// next to comments setting are enabled.
		$this->module->get_settings()->set(
			array(
				'clientID'                  => '1234567890.googleusercontent.com',
				'showNextToCommentsEnabled' => true,
			)
		);
		update_site_option( 'users_can_register', true );

		// Render the button.
		ob_start();
		comment_form( array(), $post_id );
		$output = ob_get_clean();

		$this->assertStringContainsString( "<div class=\"googlesitekit-sign-in-with-google__frontend-output-button googlesitekit-sign-in-with-google__comments-form-button googlesitekit-sign-in-with-google__comments-form-button-postid-$post_id", $output, 'Button should render when when both open user registration and the Shownext to comments setting are enabled.' );
	}

	/**
	 * @dataProvider provide_button_markup_data
	 */
	public function test_render_sign_in_with_google_button( $args, $expected_strings ) {
		$this->module->register();

		ob_start();
		do_action( 'googlesitekit_render_sign_in_with_google_button', $args );
		$output = ob_get_clean();

		foreach ( $expected_strings as $expected_string ) {
			$this->assertStringContainsString( $expected_string, $output, 'Expected string not found in output.' );
		}
	}

	public function provide_button_markup_data() {
		return array(
			'default markup'                       => array(
				array(),
				array( 'class="googlesitekit-sign-in-with-google__frontend-output-button"' ),
			),
			'with extra class'                     => array(
				array( 'class' => 'extra-class' ),
				array( 'class="googlesitekit-sign-in-with-google__frontend-output-button extra-class"' ),
			),
			'with valid data attributes'           => array(
				array(
					'text'  => 'continue_with',
					'theme' => 'filled_blue',
					'shape' => 'pill',
				),
				array(
					'data-googlesitekit-siwg-text="continue_with"',
					'data-googlesitekit-siwg-theme="filled_blue"',
					'data-googlesitekit-siwg-shape="pill"',
				),
			),
			'with class and valid data attributes' => array(
				array(
					'class' => 'extra-class',
					'text'  => 'continue_with',
					'theme' => 'filled_blue',
					'shape' => 'pill',
				),
				array(
					'class="googlesitekit-sign-in-with-google__frontend-output-button extra-class"',
					'data-googlesitekit-siwg-text="continue_with"',
					'data-googlesitekit-siwg-theme="filled_blue"',
					'data-googlesitekit-siwg-shape="pill"',
				),
			),
			'does not omit invalid values'         => array(
				array(
					'text'  => 'invalid value',
					'theme' => 'filled@blue',
					'shape' => 'pill',
				),
				array(
					'data-googlesitekit-siwg-text="invalid value"',
					'data-googlesitekit-siwg-theme="filled@blue"',
					'data-googlesitekit-siwg-shape="pill"',
				),
			),
		);
	}

	public function test_handle_disconnect_user__bad_nonce() {
		$this->module->register();

		$_GET['nonce'] = 'bad-nonce';
		try {
			do_action( 'admin_action_' . Sign_In_With_Google::ACTION_DISCONNECT );
			$this->fail( 'Expected invalid nonce exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertEquals( $die_exception->getMessage(), 'The link you followed has expired.', 'Invalid nonce should produce expired link error.' );
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
			$this->assertEquals( get_edit_user_link( $admin_id ), $redirect_url, 'Redirect should go to admin user profile when lacking capability.' );
		}
		// Assert user was not disconnected.
		$this->assertEquals( '111111', get_user_option( Hashed_User_ID::OPTION, $admin_id ), 'Admin user should remain connected; no disconnect expected.' );
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
			$this->assertStringStartsWith( get_edit_user_link( $editor_id ), $redirect_url, 'Redirect should go to editor profile after self-disconnect.' );
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $redirect_params );
			$this->assertArrayHasKey( 'updated', $redirect_params, 'Redirect params should include updated flag.' );
		}
		$this->assertEmpty( get_user_option( Hashed_User_ID::OPTION, $editor_id ), 'Editor should be disconnected (user option cleared).' );
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
			$this->assertStringStartsWith( get_edit_user_link( $editor_id ), $redirect_url, 'Redirect should go to editor profile after admin disconnects editor.' );
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $redirect_params );
			$this->assertArrayHasKey( 'updated', $redirect_params, 'Redirect params should include updated flag after admin disconnect.' );
		}
		$this->assertEmpty( get_user_option( Hashed_User_ID::OPTION, $editor_id ), 'Editor should be disconnected (user option cleared) by admin.' );
	}

	public function test_render_disconnect_profile() {
		$this->module->register();

		$user_id       = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$user_id_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Does not render the disconnect settings if the user meta is not set.
		wp_set_current_user( $user_id );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertEmpty( $output, 'Disconnect settings should not render when user meta not set.' );

		// Should render the disconnect settings on the users own profile for editors and admins.
		update_user_option( $user_id, Hashed_User_ID::OPTION, '111111' );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'You can sign in with your Google account.', $output, 'Disconnect settings should render on own profile when user meta set.' );

		update_user_option( $user_id_admin, Hashed_User_ID::OPTION, '222222' );
		wp_set_current_user( $user_id_admin );
		$output = $this->capture_action( 'show_user_profile', wp_get_current_user() );
		$this->assertStringContainsString( 'You can sign in with your Google account.', $output, 'Disconnect settings should render for admin on own profile.' );

		if ( is_multisite() ) {
			return; // TODO: The below results in an empty output on multisite.
		}

		// Should render the disconnect settings for other user if user is an admin.
		wp_set_current_user( $user_id_admin );
		$output = $this->capture_action( 'edit_user_profile', get_user_by( 'id', $user_id ) );
		$this->assertStringContainsString( 'This user can sign in with their Google account.', $output, 'Disconnect settings should render on other user profile for admins.' );
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
			$this->assertEquals( $redirect_uri, $e->get_location(), 'POST auth callback should redirect to provided URI.' );
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

		$this->assertOptionNotExists( Existing_Client_ID::OPTION, 'Existing client ID option should not exist before deactivation.' );
		$this->module->on_deactivation();
		$this->assertEquals( 'test_client_id.apps.googleusercontent.com', get_option( Existing_Client_ID::OPTION ), 'Existing client ID should be persisted on deactivation.' );
	}

	public function test_inline_data_has_woocommerce() {
		$this->module->register();
		$this->module->get_settings()->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals( false, $inline_modules_data['sign-in-with-google']['isWooCommerceActive'], 'WooCommerce should be inactive by default in inline data.' );
		$this->assertEquals( false, $inline_modules_data['sign-in-with-google']['isWooCommerceRegistrationEnabled'], 'WooCommerce registration should be disabled by default in inline data.' );
	}

	public function test_inline_data_with_no_existing_client_id() {
		$this->module->register();
		$this->module->get_settings()->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayNotHasKey( 'existingClientID', $inline_modules_data['sign-in-with-google'], 'Inline data should not include existingClientID when not set.' );
	}

	public function test_inline_data_with_existing_client_id() {
		$this->module->register();
		$this->module->get_settings()->register();

		update_option( Existing_Client_ID::OPTION, 'test_client_id.apps.googleusercontent.com' );

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals( 'test_client_id.apps.googleusercontent.com', $inline_modules_data['sign-in-with-google']['existingClientID'], 'Inline data should include existingClientID when option set.' );
	}
}
