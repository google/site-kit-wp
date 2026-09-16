<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\WooCommerce_AuthenticatorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader_Interface;
use Google\Site_Kit\Modules\Sign_In_With_Google\WooCommerce_Authenticator;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/wc-function-fakes.php';

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class WooCommerce_AuthenticatorTest extends TestCase {

	public function set_up() {
		parent::set_up();

		// WooCommerce itself registers the "customer" role (via
		// `WC_Install::create_roles()`) whenever the plugin is active, which
		// is the only time this class is ever used in production. Register a
		// minimal stand-in here since the WooCommerce plugin isn't loaded in
		// this test environment.
		if ( ! get_role( 'customer' ) ) {
			add_role( 'customer', 'Customer', array( 'read' => true ) );
		}
	}

	private static $new_user_payload = array(
		'sub'         => 'non-existing-user',
		'email'       => 'non-existing-user@example.com',
		'name'        => 'First Last',
		'given_name'  => 'First',
		'family_name' => 'Last',
	);

	private function do_authenticate_user( $profile_reader_data = array() ) {
		$user_options        = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$mock_profile_reader = $this->getMockBuilder( Profile_Reader_Interface::class )
									->setMethods( array( 'get_profile_data' ) )
									->getMock();
		$mock_profile_reader->method( 'get_profile_data' )->willReturn( $profile_reader_data );
		$authenticator = new WooCommerce_Authenticator( $user_options, $mock_profile_reader );

		return $authenticator->authenticate_user( new MutableInput() );
	}

	private function disable_all_woocommerce_registration_options() {
		update_option( 'woocommerce_enable_myaccount_registration', 'no' );
		update_option( 'woocommerce_enable_signup_and_login_from_checkout', 'no' );
		update_option( 'woocommerce_enable_delayed_account_creation', 'no' );
	}

	public function test_is_woocommerce_registration_open__all_options_disabled() {
		$this->disable_all_woocommerce_registration_options();

		$this->assertFalse( WooCommerce_Authenticator::is_woocommerce_registration_open(), 'Should be false when none of the three WooCommerce options are enabled.' );
	}

	public function test_is_woocommerce_registration_open__myaccount_registration_enabled() {
		$this->disable_all_woocommerce_registration_options();
		update_option( 'woocommerce_enable_myaccount_registration', 'yes' );

		$this->assertTrue( WooCommerce_Authenticator::is_woocommerce_registration_open(), 'Should be true when My Account registration is enabled.' );
	}

	public function test_is_woocommerce_registration_open__checkout_registration_enabled() {
		$this->disable_all_woocommerce_registration_options();
		update_option( 'woocommerce_enable_signup_and_login_from_checkout', 'yes' );

		$this->assertTrue( WooCommerce_Authenticator::is_woocommerce_registration_open(), 'Should be true when checkout registration is enabled.' );
	}

	public function test_is_woocommerce_registration_open__delayed_account_creation_enabled() {
		$this->disable_all_woocommerce_registration_options();
		update_option( 'woocommerce_enable_delayed_account_creation', 'yes' );

		$this->assertTrue( WooCommerce_Authenticator::is_woocommerce_registration_open(), 'Should be true when delayed (after checkout) account creation is enabled.' );
	}

	public function test_is_woocommerce_registration_open__respects_checkout_registration_filter() {
		$this->disable_all_woocommerce_registration_options();
		add_filter( 'woocommerce_checkout_registration_enabled', '__return_true' );

		$this->assertTrue(
			WooCommerce_Authenticator::is_woocommerce_registration_open(),
			'Should honor the woocommerce_checkout_registration_enabled filter WooCommerce itself applies, even when the underlying option is off.'
		);
	}

	/**
	 * `Authenticator::is_woocommerce_registration_open()` (the private helper
	 * shared with the base class) only consults WooCommerce's options when
	 * `class_exists( 'WooCommerce' )` is true. In production that's always
	 * the case here, since `resolve_authenticator_class()` only ever selects
	 * this class when that's already true; faked explicitly since this test
	 * constructs `WooCommerce_Authenticator` directly.
	 *
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user_creates_customer_when_only_woocommerce_registration_is_open() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			class_alias( __CLASS__, 'WooCommerce' );
		}

		add_filter( 'option_users_can_register', '__return_false' );
		update_option( 'woocommerce_enable_myaccount_registration', 'yes' );

		$actual = $this->do_authenticate_user( self::$new_user_payload );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user->ID, 'Should create and sign in a new user when WooCommerce registration is open.' );
		$this->assertEquals( self::$new_user_payload['email'], $user->user_email, 'New user email should match payload.' );
		$this->assertTrue( in_array( 'customer', $user->roles, true ), 'New user role should be customer when only WooCommerce registration is open.' );
		$this->assertNotEmpty( $actual, 'Should redirect after creating the user.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user_creates_customer_when_only_delayed_account_creation_is_open() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			class_alias( __CLASS__, 'WooCommerce' );
		}

		add_filter( 'option_users_can_register', '__return_false' );
		$this->disable_all_woocommerce_registration_options();
		update_option( 'woocommerce_enable_delayed_account_creation', 'yes' );

		$this->do_authenticate_user( self::$new_user_payload );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user->ID, 'Should create and sign in a new user when only delayed account creation is open.' );
		$this->assertTrue( in_array( 'customer', $user->roles, true ), 'New user role should be customer when only delayed account creation is open.' );
	}

	public function test_authenticate_user_uses_wordpress_default_role_when_wordpress_registration_is_open() {
		add_filter( 'option_users_can_register', '__return_true' );
		add_filter( 'option_default_role', fn () => 'editor' );
		// WooCommerce registration is closed; the WordPress path should still work.
		$this->disable_all_woocommerce_registration_options();

		$this->do_authenticate_user( self::$new_user_payload );

		$user = wp_get_current_user();
		$this->assertTrue( in_array( 'editor', $user->roles, true ), 'New user role should fall back to the WordPress default role when WooCommerce registration is closed.' );
	}

	public function test_authenticate_user_prefers_wordpress_default_role_when_both_registrations_are_open() {
		add_filter( 'option_users_can_register', '__return_true' );
		add_filter( 'option_default_role', fn () => 'editor' );
		update_option( 'woocommerce_enable_myaccount_registration', 'yes' );

		$this->do_authenticate_user( self::$new_user_payload );

		$user = wp_get_current_user();
		$this->assertTrue( in_array( 'editor', $user->roles, true ), 'New user role should be the WordPress default role when WordPress registration is open, even if WooCommerce registration is also open.' );
		$this->assertFalse( in_array( 'customer', $user->roles, true ), 'New user should not get the WooCommerce customer role when WordPress registration is the open path.' );
	}

	public function test_authenticate_user_fails_when_both_registrations_are_closed() {
		add_filter( 'option_users_can_register', '__return_false' );
		$this->disable_all_woocommerce_registration_options();

		$actual = $this->do_authenticate_user( self::$new_user_payload );

		$this->assertStringContainsString( 'googlesitekit_auth_failed', $actual, 'Should redirect with the sign-in failed error when neither registration path is open.' );
		$this->assertEquals( 0, get_current_user_id(), 'Should not sign in or create a user when registration is closed everywhere.' );
	}

	public function test_authenticate_user_signs_in_existing_user_regardless_of_registration_settings() {
		add_filter( 'option_users_can_register', '__return_false' );
		update_option( 'woocommerce_enable_myaccount_registration', 'no' );

		$user         = $this->factory()->user->create_and_get( array( 'user_email' => self::$new_user_payload['email'] ) );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$new_user_payload['sub'] ) );

		$this->do_authenticate_user( self::$new_user_payload );

		$this->assertEquals( $user->ID, get_current_user_id(), 'Should sign in the existing, already-connected user even with registration closed everywhere.' );
	}
}
