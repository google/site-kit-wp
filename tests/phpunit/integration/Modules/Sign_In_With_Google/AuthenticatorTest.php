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
use Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Profile_Reader;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

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
		$user_options   = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$profile_reader = new Profile_Reader( $profile_reader_data );
		$authenticator  = new Authenticator( $user_options, $profile_reader );

		return $authenticator->authenticate_user( new MutableInput() );
	}

	public function test_authenticate_user_fails_when_csrf_tokens_dont_match() {
		$_COOKIE['g_csrf_token'] = 'invalid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = add_query_arg( 'error', Authenticator::ERROR_INVALID_CSRF_TOKEN, wp_login_url() );
		$got  = $this->do_authenticate_user();

		$this->assertEquals( $want, $got );
	}

	public function test_authenticate_user_fails_when_profile_reader_returns_error() {
		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = add_query_arg( 'error', Authenticator::ERROR_INVALID_REQUEST, wp_login_url() );
		$got  = $this->do_authenticate_user( new WP_Error( 'test_error' ) );

		$this->assertEquals( $want, $got );
	}

	public function test_authenticate_user_fails_when_find_user_returns_error() {
		// We don't have this user and user registration is disabled.
		add_filter( 'option_users_can_register', '__return_false' );

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = add_query_arg( 'error', Authenticator::ERROR_SIGNIN_FAILED, wp_login_url() );
		$got  = $this->do_authenticate_user( self::$nonexisting_user_payload );

		$this->assertEquals( $want, $got );
	}

	public function test_authenticate_user_redirects_when_user_is_found_by_sub() {
		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user         = $this->factory()->user->create_and_get( array() );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		$want = admin_url( '/profile.php' );
		$got  = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $want, $got );
		$this->assertEquals( $user->ID, get_current_user_id() );
	}

	public function test_authenticate_user_redirects_when_user_is_found_by_email() {
		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$want = admin_url( '/profile.php' );
		$got  = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $want, $got );
		$this->assertEquals( $user->ID, get_current_user_id() );
	}

	public function test_authenticate_user_redirects_to_url_set_in_cookie() {
		$want = home_url( '/uncategorized/hello-world' );
		$_COOKIE[ Authenticator::REDIRECT_COOKIE_NAME ] = $want;

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user         = $this->factory()->user->create_and_get( array() );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( self::$existing_user_payload['sub'] ) );

		$got = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $want, $got );
		$this->assertEquals( $user->ID, get_current_user_id() );
	}

	public function test_authenticate_user_creates_new_user_when_registration_is_allowed() {
		add_filter( 'option_users_can_register', '__return_true' );
		add_filter(
			'option_default_role',
			function () {
				return 'editor';
			}
		);

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = admin_url();
		$got  = $this->do_authenticate_user( self::$new_user_payload );

		$this->assertEquals( $want, $got );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user );

		$this->assertEquals( self::$new_user_payload['email'], $user->user_email );
		$this->assertEquals( self::$new_user_payload['name'], $user->display_name );
		$this->assertEquals( self::$new_user_payload['given_name'], $user->first_name );
		$this->assertEquals( self::$new_user_payload['family_name'], $user->last_name );

		$this->assertTrue( in_array( 'editor', $user->roles, true ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_user_add_new_user_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_true' );

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = admin_url();
		$got  = $this->do_authenticate_user( self::$new_user_payload );

		$this->assertEquals( $want, $got );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user );

		$blog_id = get_current_blog_id();
		$this->assertTrue( is_user_member_of_blog( $user->ID, $blog_id ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_user_add_existing_user_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_true' );

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$blog_id = get_current_blog_id();
		$this->assertFalse( is_user_member_of_blog( $user->ID, $blog_id ) );

		$want = admin_url( '/profile.php' );
		$got  = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $want, $got );
		$this->assertTrue( is_user_member_of_blog( $user->ID, $blog_id ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_fails_when_user_not_added_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_false' );

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$blog_id = get_current_blog_id();
		$this->assertFalse( is_user_member_of_blog( $user->ID, $blog_id ) );

		$want = add_query_arg( 'error', Authenticator::ERROR_INVALID_REQUEST, wp_login_url() );
		$got  = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $want, $got );
	}

	/**
	 * @group ms-required
	 */
	public function test_authenticate_redirects_when_user_added_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		add_filter( 'option_users_can_register', '__return_false' );

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user = $this->factory()->user->create_and_get( array( 'user_email' => self::$existing_user_payload['email'] ) );

		$blog_id = get_current_blog_id();
		add_user_to_blog( $blog_id, $user->ID, 'subscriber' );

		$want = admin_url( '/profile.php' );
		$got  = $this->do_authenticate_user( self::$existing_user_payload );

		$this->assertEquals( $want, $got );
	}
}
