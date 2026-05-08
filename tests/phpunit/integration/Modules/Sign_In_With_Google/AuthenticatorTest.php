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
