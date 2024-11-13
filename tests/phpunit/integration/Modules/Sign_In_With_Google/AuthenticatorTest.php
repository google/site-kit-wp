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

	private function get_authenticator( $profile_reader_data = array() ) {
		$user_options   = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$profile_reader = new Profile_Reader( $profile_reader_data );
		$authenticator  = new Authenticator( $user_options, $profile_reader );

		return $authenticator;
	}

	public function test_authenticate_user_fails_when_csrf_tokens_dont_match() {
		$_COOKIE['g_csrf_token'] = 'invalid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = add_query_arg( 'error', Authenticator::ERROR_INVALID_CSRF_TOKEN, wp_login_url() );
		$got  = $this->get_authenticator()->authenticate_user( new MutableInput() );

		$this->assertEquals( $want, $got );
	}

	public function test_authenticate_user_fails_when_profile_reader_returns_error() {
		$payload = new WP_Error( 'test_error' );

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = add_query_arg( 'error', Authenticator::ERROR_INVALID_REQUEST, wp_login_url() );
		$got  = $this->get_authenticator( $payload )->authenticate_user( new MutableInput() );

		$this->assertEquals( $want, $got );
	}

	public function test_authenticate_user_fails_when_find_user_returns_error() {
		// We don't have this user and user registration is disabled.
		$payload = array(
			'sub'   => 'non-existing-user',
			'email' => 'non-existing-user@example.com',
		);

		add_filter( 'option_users_can_register', '__return_false' );

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$want = add_query_arg( 'error', Authenticator::ERROR_SIGNIN_FAILED, wp_login_url() );
		$got  = $this->get_authenticator( $payload )->authenticate_user( new MutableInput() );

		$this->assertEquals( $want, $got );
	}

	public function test_authenticate_user_redirects_when_user_is_found_by_sub() {
		$payload = array(
			'sub'   => 'existing-user',
			'email' => 'existing-user@example.com',
		);

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user         = $this->factory()->user->create_and_get( array() );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( $payload['sub'] ) );

		$want = admin_url( '/profile.php' );
		$got  = $this->get_authenticator( $payload )->authenticate_user( new MutableInput() );

		$this->assertEquals( $want, $got );
		$this->assertEquals( $user->ID, get_current_user_id() );
	}

	public function test_authenticate_user_redirects_when_user_is_found_by_email() {
		$payload = array(
			'sub'   => 'existing-user',
			'email' => 'existing-user@example.com',
		);

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user = $this->factory()->user->create_and_get( array( 'user_email' => $payload['email'] ) );

		$want = admin_url( '/profile.php' );
		$got  = $this->get_authenticator( $payload )->authenticate_user( new MutableInput() );

		$this->assertEquals( $want, $got );
		$this->assertEquals( $user->ID, get_current_user_id() );
	}

	public function test_authenticate_user_redirects_to_url_set_in_cookie() {
		$payload = array(
			'sub'   => 'existing-user',
			'email' => 'existing-user@example.com',
		);

		$want = home_url( '/uncategorized/hello-world' );
		$_COOKIE[ Authenticator::REDIRECT_COOKIE_NAME ] = $want;

		$_COOKIE['g_csrf_token'] = 'valid-csrf-token';
		$_POST['g_csrf_token']   = 'valid-csrf-token';

		$user         = $this->factory()->user->create_and_get( array() );
		$user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $user->ID );
		$user_options->set( Hashed_User_ID::OPTION, md5( $payload['sub'] ) );

		$got = $this->get_authenticator( $payload )->authenticate_user( new MutableInput() );

		$this->assertEquals( $want, $got );
		$this->assertEquals( $user->ID, get_current_user_id() );
	}

	public function test_authenticate_user_creates_new_user_when_registration_is_allowed() {
		$payload = array(
			'sub'         => 'non-existing-user',
			'email'       => 'non-existing-user@example.com',
			'name'        => 'First Last',
			'given_name'  => 'First',
			'family_name' => 'Last',
		);

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
		$got  = $this->get_authenticator( $payload )->authenticate_user( new MutableInput() );

		$this->assertEquals( $want, $got );

		$user = wp_get_current_user();
		$this->assertNotEmpty( $user );

		$this->assertEquals( $payload['email'], $user->user_email );
		$this->assertEquals( $payload['name'], $user->display_name );
		$this->assertEquals( $payload['given_name'], $user->first_name );
		$this->assertEquals( $payload['family_name'], $user->last_name );

		$this->assertTrue( in_array( 'editor', $user->roles, true ) );
	}
}
