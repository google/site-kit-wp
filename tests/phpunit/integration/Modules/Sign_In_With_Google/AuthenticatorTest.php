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
use WP_Error;
use WP_Site;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class AuthenticatorTest extends TestCase {

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

	private function create_mock_profile_reader( $profile_reader_data ) {
		$mock_profile_reader = $this->getMockBuilder( Profile_Reader_Interface::class )
									->setMethods( array( 'get_profile_data' ) )
									->getMock();
		$mock_profile_reader->method( 'get_profile_data' )->willReturn( $profile_reader_data );

		return $mock_profile_reader;
	}

	private function do_authenticate_user( $profile_reader_data = array() ) {
		$user_options  = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$authenticator = new Authenticator( $user_options, $this->create_mock_profile_reader( $profile_reader_data ) );

		return $authenticator->authenticate_user( new MutableInput() );
	}

	private function create_two_factor_authenticator( $profile_reader_data ) {
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		return new FakeTwoFactorAuthenticator( $user_options, $this->create_mock_profile_reader( $profile_reader_data ) );
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

	public function test_authenticate_user__errors_when_email_matched_user_has_two_factor() {
		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$authenticator                              = $this->create_two_factor_authenticator( self::$existing_user_payload );
		$authenticator->is_two_factor_plugin_active = true;
		$authenticator->user_ids_with_two_factor    = array( $user->ID );

		$expected = add_query_arg( 'error', 'googlesitekit_auth_two_factor_enabled', wp_login_url() );
		$actual   = $authenticator->authenticate_user( new MutableInput() );

		$this->assertEquals( $expected, $actual, 'Should redirect to login with the two-factor error when the email-matched user has two-factor authentication enabled.' );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$this->assertFalse(
			metadata_exists( 'user', $user->ID, $user_options->get_meta_key( Hashed_User_ID::OPTION ) ),
			'The Google account should not be linked to the user.'
		);
		$this->assertEquals( 0, get_current_user_id(), 'The user should not be signed in.' );
	}

	public function test_authenticate_user__links_email_matched_user_without_two_factor() {
		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$authenticator                              = $this->create_two_factor_authenticator( self::$existing_user_payload );
		$authenticator->is_two_factor_plugin_active = true;
		$authenticator->user_ids_with_two_factor    = array();

		$expected = admin_url( '/profile.php' );
		$actual   = $authenticator->authenticate_user( new MutableInput() );

		$this->assertEquals( $expected, $actual, 'Should redirect to profile when the email-matched user has no two-factor authentication.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Authenticated user ID should match the email-matched user.' );

		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$this->assertEquals(
			md5( self::$existing_user_payload['sub'] ),
			$user_options->get( Hashed_User_ID::OPTION ),
			'The Google account should be linked to the user.'
		);
	}

	public function test_authenticate_user__links_email_matched_user_when_two_factor_plugin_is_inactive() {
		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );
		update_user_meta( $user->ID, '_two_factor_enabled_providers', array( 'Two_Factor_Email' ) );

		// The plugin-active flag stays false, and no two-factor users are
		// faked, so the real user_has_two_factor() runs.
		$authenticator = $this->create_two_factor_authenticator( self::$existing_user_payload );

		$expected = admin_url( '/profile.php' );
		$actual   = $authenticator->authenticate_user( new MutableInput() );

		$this->assertEquals( $expected, $actual, 'Should redirect to profile when the Two-Factor plugin is inactive.' );
		$this->assertEquals( $user->ID, get_current_user_id(), 'Authenticated user ID should match the email-matched user.' );
	}

	public function test_authenticate_user__removes_two_factor_login_challenge_for_new_user() {
		add_filter( 'option_users_can_register', '__return_true' );

		// Emulate the Two-Factor plugin's login challenge on the wp_login action.
		add_action( 'wp_login', array( 'Two_Factor_Core', 'wp_login' ), PHP_INT_MAX, 2 );

		$authenticator                              = $this->create_two_factor_authenticator( self::$new_user_payload );
		$authenticator->is_two_factor_plugin_active = true;

		$authenticator->authenticate_user( new MutableInput() );

		$user_id = get_current_user_id();
		$this->assertNotEmpty( $user_id, 'A new user should be created and signed in.' );
		$this->assertFalse(
			has_action( 'wp_login', array( 'Two_Factor_Core', 'wp_login' ) ),
			'The Two-Factor login challenge should be removed for the Sign in with Google request.'
		);
		$this->assertFalse(
			metadata_exists( 'user', $user_id, '_two_factor_enabled_providers' ),
			'Sign in with Google should not modify the new account\'s two-factor settings.'
		);
	}

	public function test_authenticate_user__removes_two_factor_login_challenge_for_returning_user() {
		$user         = $this->factory()->user->create_and_get( array() );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		// Emulate the Two-Factor plugin's login challenge on the wp_login action.
		add_action( 'wp_login', array( 'Two_Factor_Core', 'wp_login' ), PHP_INT_MAX, 2 );

		$authenticator                              = $this->create_two_factor_authenticator( self::$existing_user_payload );
		$authenticator->is_two_factor_plugin_active = true;

		$authenticator->authenticate_user( new MutableInput() );

		$this->assertEquals( $user->ID, get_current_user_id(), 'The returning Sign in with Google user should be signed in.' );
		$this->assertFalse(
			has_action( 'wp_login', array( 'Two_Factor_Core', 'wp_login' ) ),
			'The Two-Factor login challenge should be removed so the returning user can sign in.'
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
