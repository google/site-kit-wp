<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\AuthenticatorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator;
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader_Interface;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Two_Factor_Plugin_Trait;
use WP_Error;
use WP_Site;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class AuthenticatorTest extends TestCase {

	use Two_Factor_Plugin_Trait;

	private static $existing_user_payload = array(
		'sub'   => 'existing-user',
		'email' => 'existing-user@example.com',
	);

	private static $nonexisting_user_payload = array(
		'sub'   => 'non-existing-user',
		'email' => 'non-existing-user@example.com',
	);

	private static $new_user_payload = array(
		'sub'         => 'non-existing-user',
		'email'       => 'non-existing-user@example.com',
		'name'        => 'First Last',
		'given_name'  => 'First',
		'family_name' => 'Last',
	);

	/**
	 * The original $_COOKIE data.
	 *
	 * @var array
	 */
	private $cookie_data;

	/**
	 * The original $_POST data.
	 *
	 * @var array
	 */
	private $post_data;

	public function set_up() {
		parent::set_up();

		// Store the original $_COOKIE and $_POST data.
		$this->cookie_data = $_COOKIE;
		$this->post_data   = $_POST;
	}

	public function tear_down() {
		parent::tear_down();

		// Restore the original $_COOKIE and $_POST data.
		$_COOKIE = $this->cookie_data;
		$_POST   = $this->post_data;
	}

	private function do_authenticate_user( $profile_reader_data = array() ) {
		$user_options        = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$mock_profile_reader = $this->getMockBuilder( Profile_Reader_Interface::class )
									->setMethods( array( 'get_profile_data' ) )
									->getMock();
		$mock_profile_reader->method( 'get_profile_data' )->willReturn( $profile_reader_data );
		$authenticator = new Authenticator( $user_options, $mock_profile_reader );

		return $authenticator->authenticate_user( new MutableInput() );
	}

	public function test_authenticate_user_fails_when_profile_reader_returns_error() {
		$expected = add_query_arg( 'error', Authenticator::ERROR_INVALID_REQUEST, wp_login_url() );
		$actual   = $this->do_authenticate_user( new WP_Error( 'test_error' ) );

		$this->assertEquals( $expected, $actual, 'Should redirect to login with invalid request error when profile reader returns error.' );
	}

	public function test_authenticate_user_fails_when_find_user_returns_error() {
		// We don't have this user and user registration is disabled.
		add_filter( 'option_users_can_register', '__return_false' );

		$expected = add_query_arg( 'error', Authenticator::ERROR_SIGNIN_FAILED, wp_login_url() );
		$actual   = $this->do_authenticate_user( self::$nonexisting_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to login with sign-in failed error when user not found and registration disabled.' );
	}

	public function test_authenticate_user_redirects_when_user_is_found_by_sub() {
		$user         = $this->factory()->user->create_and_get( array() );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		$expected = admin_url( '/profile.php' );
		$actual   = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to profile when user found by sub.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Authenticated user ID should match found user.' );
	}

	public function test_authenticate_user_redirects_when_user_is_found_by_email() {
		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$expected = admin_url( '/profile.php' );
		$actual   = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to profile when user found by email.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Authenticated user ID should match found user.' );
	}

	public function test_authenticate_user_redirects_to_url_set_in_cookie() {
		$expected = home_url( '/uncategorized/hello-world' );

		$_COOKIE[ Authenticator::COOKIE_REDIRECT_TO ] = $expected;

		$user         = $this->factory()->user->create_and_get( array() );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		$actual = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to URL from cookie when set.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Authenticated user ID should match after cookie redirect.' );
	}

	public function test_authenticate_user_creates_new_user_when_registration_is_allowed() {
		add_filter( 'option_users_can_register', '__return_true' );
		add_filter( 'option_default_role', fn () => 'editor' );

		$expected = admin_url();
		$actual   = $this->do_authenticate_user( self::$new_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to admin URL after creating new user when registration allowed.' );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user, 'Newly created user should be current user.' );

		$this->assertEquals( self::$new_user_payload['email'], $user->user_email, 'New user email should match payload.' );
		$this->assertEquals( self::$new_user_payload['name'], $user->display_name, 'New user display name should match payload.' );
		$this->assertEquals( self::$new_user_payload['given_name'], $user->first_name, 'New user first name should match payload.' );
		$this->assertEquals( self::$new_user_payload['family_name'], $user->last_name, 'New user last name should match payload.' );

		$this->assertTrue( in_array( 'editor', $user->roles, true ), 'New user role should be editor.' );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$this->assertEquals(
			Sign_In_With_Google::MODULE_SLUG,
			get_user_meta( $user->ID, $user_options->get_meta_key( Authenticator::CREATED_BY_META_KEY ), true ),
			'Newly created user should be marked as created via Sign in with Google.'
		);
		$this->assertEquals(
			md5( self::$new_user_payload['sub'] ),
			$user_options->get( Hashed_User_ID::OPTION ),
			'Newly created user should have the hashed Google user ID persisted.'
		);
	}

	/**
	 * The WordPress login page (and One Tap there) never sends an
	 * `integration=woocommerce` POST value, so these requests always use this
	 * base `Authenticator`, even when WooCommerce is active. WooCommerce's own
	 * account-creation settings must still open registration for that flow.
	 *
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user_creates_customer_when_only_woocommerce_registration_is_open() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			// `class_alias()` requires a user-defined source class, so alias
			// this test case rather than an internal class like `stdClass`.
			class_alias( __CLASS__, 'WooCommerce' );
		}

		if ( ! get_role( 'customer' ) ) {
			// WooCommerce itself registers this role when active; stand in
			// for it since the plugin isn't loaded in this test environment.
			add_role( 'customer', 'Customer', array( 'read' => true ) );
		}

		add_filter( 'option_users_can_register', '__return_false' );
		update_option( 'woocommerce_enable_myaccount_registration', 'yes' );

		// The `customer` role has no `edit_posts` capability, so the base
		// Authenticator's own (unmodified) redirect logic sends them to their
		// profile rather than the admin dashboard root — the same redirect
		// path any non-edit_posts WordPress role would get, not anything
		// WooCommerce-specific.
		$expected = admin_url( '/profile.php' );
		$actual   = $this->do_authenticate_user( self::$new_user_payload );

		$this->assertEquals( $expected, $actual, 'Should follow the base Authenticator\'s own redirect logic, not WooCommerce\'s.' );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user->ID, 'Should create and sign in a new user via the WordPress login page flow when only WooCommerce registration is open.' );
		$this->assertTrue( in_array( 'customer', $user->roles, true ), 'New user role should be customer when only WooCommerce registration is open.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user_prefers_wordpress_default_role_when_both_registrations_are_open_on_wordpress_login() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			class_alias( __CLASS__, 'WooCommerce' );
		}

		add_filter( 'option_users_can_register', '__return_true' );
		add_filter( 'option_default_role', fn () => 'editor' );
		update_option( 'woocommerce_enable_myaccount_registration', 'yes' );

		$this->do_authenticate_user( self::$new_user_payload );

		$user = wp_get_current_user();
		$this->assertTrue( in_array( 'editor', $user->roles, true ), 'New user role should be the WordPress default role when WordPress registration is open, even if WooCommerce registration is also open.' );
		$this->assertFalse( in_array( 'customer', $user->roles, true ), 'New user should not get the WooCommerce customer role when WordPress registration is the open path.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user_fails_when_both_registrations_are_closed_on_wordpress_login() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			class_alias( __CLASS__, 'WooCommerce' );
		}

		add_filter( 'option_users_can_register', '__return_false' );
		update_option( 'woocommerce_enable_myaccount_registration', 'no' );
		update_option( 'woocommerce_enable_signup_and_login_from_checkout', 'no' );
		update_option( 'woocommerce_enable_delayed_account_creation', 'no' );

		$expected = add_query_arg( 'error', Authenticator::ERROR_SIGNIN_FAILED, wp_login_url() );
		$actual   = $this->do_authenticate_user( self::$new_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to login with sign-in failed error when neither registration path is open.' );
		$this->assertEquals( 0, get_current_user_id(), 'Should not sign in or create a user when registration is closed everywhere.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user_signs_in_existing_user_when_both_registrations_are_closed_on_wordpress_login() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			class_alias( __CLASS__, 'WooCommerce' );
		}

		add_filter( 'option_users_can_register', '__return_false' );
		update_option( 'woocommerce_enable_myaccount_registration', 'no' );

		$user         = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		$actual = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( admin_url( '/profile.php' ), $actual, 'Should redirect to the profile page after signing in.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Existing user should be able to sign in regardless of registration settings.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user__blocks_two_factor_user_with_no_connected_account() {
		$this->activate_two_factor_plugin();

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$this->enable_two_factor_for_user( $user->ID );

		$expected = add_query_arg( 'error', 'googlesitekit_auth_two_factor_enabled', wp_login_url() );
		$actual   = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to the login page with the two-factor error.' );
		$this->assertEquals( 0, get_current_user_id(), 'Should leave the user signed out.' );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$this->assertFalse(
			metadata_exists( 'user', $user->ID, $user_options->get_meta_key( Hashed_User_ID::OPTION ) ),
			'Should leave the Google account unconnected.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user__blocks_two_factor_user_connected_to_another_google_account() {
		$this->activate_two_factor_plugin();

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$this->enable_two_factor_for_user( $user->ID );

		$connected_account = md5( 'another-google-account' );
		$user_options      = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, $connected_account );

		$expected = add_query_arg( 'error', 'googlesitekit_auth_two_factor_enabled', wp_login_url() );
		$actual   = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to the login page with the two-factor error.' );
		$this->assertEquals( 0, get_current_user_id(), 'Should leave the user signed out.' );
		$this->assertEquals(
			$connected_account,
			$user_options->get( Hashed_User_ID::OPTION ),
			'Should leave the connected Google account untouched.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user__signs_in_two_factor_user_with_connected_account() {
		$this->activate_two_factor_plugin();

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$this->enable_two_factor_for_user( $user->ID );

		// Connecting from the profile page stores the hashed Google user ID.
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		$actual = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( admin_url( '/profile.php' ), $actual, 'Should redirect to the profile page after signing in.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Should sign the connected user in.' );
		$this->assertFalse(
			$this->two_factor_challenges_user( $user->ID ),
			'Should skip the two-factor challenge for the connected user.'
		);
		$this->assertEquals(
			array( self::two_factor_provider() ),
			$this->get_two_factor_providers_for_user( $user->ID ),
			'Should leave the two-factor settings of the connected user alone.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user__connects_and_signs_in_user_without_two_factor() {
		$this->activate_two_factor_plugin();

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$actual = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( admin_url( '/profile.php' ), $actual, 'Should redirect to the profile page after signing in.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Should sign the matched user in.' );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$this->assertEquals(
			md5( self::$existing_user_payload['sub'] ),
			$user_options->get( Hashed_User_ID::OPTION ),
			'Should connect the Google account.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user__creates_and_connects_new_user() {
		$this->activate_two_factor_plugin();
		add_filter( 'option_users_can_register', '__return_true' );

		$this->do_authenticate_user( self::$new_user_payload );

		$user_id = get_current_user_id();
		$this->assertEquals(
			self::$new_user_payload['email'],
			get_userdata( $user_id )->user_email,
			'Should create the new user and sign them in.'
		);

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user_id );
		$this->assertEquals(
			md5( self::$new_user_payload['sub'] ),
			$user_options->get( Hashed_User_ID::OPTION ),
			'Should connect the new account to the Google account.'
		);
		$this->assertEquals(
			'',
			$this->get_two_factor_providers_for_user( $user_id ),
			'Should leave the two-factor settings of the new account alone.'
		);
	}

	public function test_authenticate_user__connects_user_when_two_factor_plugin_is_inactive() {
		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$this->enable_two_factor_for_user( $user->ID );

		$actual = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( admin_url( '/profile.php' ), $actual, 'Should redirect to the profile page after signing in.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Should sign the matched user in.' );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$this->assertEquals(
			md5( self::$existing_user_payload['sub'] ),
			$user_options->get( Hashed_User_ID::OPTION ),
			'Should connect the Google account.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_authenticate_user__leaves_the_two_factor_challenge_of_other_users_in_place() {
		$this->activate_two_factor_plugin();

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$this->enable_two_factor_for_user( $user->ID );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		$other_user_id = $this->factory()->user->create();
		$this->enable_two_factor_for_user( $other_user_id );

		$this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $user->ID, get_current_user_id(), 'Should sign the connected user in.' );
		$this->assertFalse(
			$this->two_factor_challenges_user( $user->ID ),
			'Should skip the two-factor challenge for the user who signed in with Google.'
		);
		$this->assertTrue(
			$this->two_factor_challenges_user( $other_user_id ),
			'Should keep the two-factor challenge for every other user.'
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_user_add_new_user_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_true' );

		$expected = admin_url( '/profile.php' );
		$actual   = $this->do_authenticate_user( self::$new_user_payload );

		$this->assertEquals( $expected, $actual, 'On multisite, should redirect to profile after creating new user.' );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user, 'Current user should be set after multisite creation.' );

		$blog_id = get_current_blog_id();
		$this->assertTrue( is_user_member_of_blog( $user->ID, $blog_id ), 'New user should be member of current blog.' );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$this->assertEquals(
			Sign_In_With_Google::MODULE_SLUG,
			get_user_meta( $user->ID, $user_options->get_meta_key( Authenticator::CREATED_BY_META_KEY ), true ),
			'Newly created user on multisite should be marked as created via Sign in with Google.'
		);
		$this->assertEquals(
			md5( self::$new_user_payload['sub'] ),
			$user_options->get( Hashed_User_ID::OPTION ),
			'Newly created user on multisite should have the hashed Google user ID persisted.'
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_user_add_existing_user_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_true' );

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$blog = $this->factory()->blog->create_and_get();
		if ( $blog instanceof WP_Site ) {
			$blog = $blog->blog_id;
		}

		switch_to_blog( $blog );
		$this->assertFalse( is_user_member_of_blog( $user->ID, $blog ), 'Existing user should not initially be member of new blog.' );

		$expected = admin_url();
		$actual   = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to admin URL after adding existing user to blog.' );
		$this->assertTrue( is_user_member_of_blog( $user->ID, $blog ), 'Existing user should be added to blog.' );
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_fails_when_user_not_added_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_false' );

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		$blog = $this->factory()->blog->create_and_get();
		if ( $blog instanceof WP_Site ) {
			$blog = $blog->blog_id;
		}

		switch_to_blog( $blog );
		$this->assertFalse( is_user_member_of_blog( $user->ID, $blog ), 'Existing user should not be a member before auth.' );

		$expected = add_query_arg( 'error', Authenticator::ERROR_INVALID_REQUEST, wp_login_url() );
		$actual   = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to login with invalid request error if not added to blog.' );
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_redirects_when_user_added_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_false' );

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$blog_id = get_current_blog_id();
		add_user_to_blog( $blog_id, $user->ID, 'subscriber' );

		$expected = admin_url( '/profile.php' );
		$actual   = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to profile when user is already a member of current blog.' );
	}
}
