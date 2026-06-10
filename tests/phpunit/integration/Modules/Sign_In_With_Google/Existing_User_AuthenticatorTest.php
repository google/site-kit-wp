<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Existing_User_AuthenticatorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator;
use Google\Site_Kit\Modules\Sign_In_With_Google\Existing_User_Authenticator;
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader_Interface;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class Existing_User_AuthenticatorTest extends TestCase {

	private static $payload = array(
		'sub'   => 'google-sub-12345',
		'email' => 'someone@example.com',
	);

	/**
	 * @var array
	 */
	private $post_data;

	public function set_up() {
		parent::set_up();

		$this->post_data = $_POST;
	}

	public function tear_down() {
		parent::tear_down();

		$_POST = $this->post_data;
	}

	private function do_authenticate_user( $profile_reader_data = array(), $with_valid_nonce = true ) {
		if ( $with_valid_nonce ) {
			$_POST['connect_nonce'] = wp_create_nonce( Authenticator::CONNECT_EXISTING_USER_NONCE_ACTION );
		}

		$user_options        = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$mock_profile_reader = $this->getMockBuilder( Profile_Reader_Interface::class )
									->setMethods( array( 'get_profile_data' ) )
									->getMock();
		$mock_profile_reader->method( 'get_profile_data' )->willReturn( $profile_reader_data );
		$authenticator = new Existing_User_Authenticator( $user_options, $mock_profile_reader );

		return $authenticator->authenticate_user( new MutableInput() );
	}

	public function test_links_current_user_to_google_account_when_unowned() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$expected = get_edit_user_link( $user_id );
		$actual   = $this->do_authenticate_user( self::$payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to the user edit link after linking.' );
		$this->assertEquals(
			md5( self::$payload['sub'] ),
			get_user_option( Hashed_User_ID::OPTION, $user_id ),
			'Hashed Google user id should be stored against the current user.'
		);
	}

	public function test_does_not_create_new_user_when_no_match_found() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$users_before = (int) ( new \WP_User_Query(
			array(
				'count_total' => true,
				'fields'      => 'ID',
			)
		) )->get_total();
		$this->do_authenticate_user( self::$payload );
		$users_after = (int) ( new \WP_User_Query(
			array(
				'count_total' => true,
				'fields'      => 'ID',
			)
		) )->get_total();

		$this->assertEquals( $users_before, $users_after, 'Existing_User_Authenticator must never create a new WordPress user.' );
	}

	public function test_links_current_user_even_when_email_does_not_match() {
		$user_id = $this->factory()->user->create( array( 'user_email' => 'different@example.com' ) );
		wp_set_current_user( $user_id );

		$expected = get_edit_user_link( $user_id );
		$actual   = $this->do_authenticate_user( self::$payload );

		$this->assertEquals( $expected, $actual, 'Should redirect to the user edit link after linking, even when emails differ.' );
		$this->assertEquals(
			md5( self::$payload['sub'] ),
			get_user_option( Hashed_User_ID::OPTION, $user_id ),
			'Current user should be linked regardless of email mismatch.'
		);
	}

	public function test_returns_error_redirect_when_google_account_taken_by_other_user() {
		$other_user_id = $this->factory()->user->create();
		update_user_option( $other_user_id, Hashed_User_ID::OPTION, md5( self::$payload['sub'] ) );

		$current_user_id = $this->factory()->user->create();
		wp_set_current_user( $current_user_id );

		$expected = add_query_arg( Existing_User_Authenticator::ERROR_QUERY_ARG, Existing_User_Authenticator::ERROR_ACCOUNT_ALREADY_CONNECTED, get_edit_user_link( $current_user_id ) );
		$actual   = $this->do_authenticate_user( self::$payload );

		$this->assertEquals( $expected, $actual, 'Should redirect with already-connected error when another user owns the Google account.' );
		$this->assertEmpty(
			get_user_option( Hashed_User_ID::OPTION, $current_user_id ),
			'Current user should not be associated with a Google account already linked to another WordPress user on the site.'
		);
	}

	public function test_returns_error_redirect_when_profile_reader_errors() {
		$current_user_id = $this->factory()->user->create();
		wp_set_current_user( $current_user_id );

		$expected = add_query_arg( Existing_User_Authenticator::ERROR_QUERY_ARG, Authenticator::ERROR_INVALID_REQUEST, get_edit_user_link( $current_user_id ) );
		$actual   = $this->do_authenticate_user( new WP_Error( 'test_error' ) );

		$this->assertEquals( $expected, $actual, 'Should redirect with invalid-request error when the profile reader returns a WP_Error.' );
		$this->assertEmpty(
			get_user_option( Hashed_User_ID::OPTION, $current_user_id ),
			'Profile reader error should not result in any Hashed_User_ID being stored.'
		);
	}

	public function test_returns_error_redirect_when_no_user_is_signed_in() {
		wp_set_current_user( 0 );

		$expected = add_query_arg( Existing_User_Authenticator::ERROR_QUERY_ARG, Authenticator::ERROR_INVALID_REQUEST, admin_url( 'profile.php' ) );
		$actual   = $this->do_authenticate_user( self::$payload );

		$this->assertEquals( $expected, $actual, 'Should redirect with invalid-request error when no user is signed in.' );
	}

	public function test_returns_error_redirect_when_connect_nonce_missing() {
		$current_user_id = $this->factory()->user->create();
		wp_set_current_user( $current_user_id );

		$expected = add_query_arg( Existing_User_Authenticator::ERROR_QUERY_ARG, Authenticator::ERROR_INVALID_REQUEST, get_edit_user_link( $current_user_id ) );
		$actual   = $this->do_authenticate_user( self::$payload, false );

		$this->assertEquals( $expected, $actual, 'Should redirect with invalid-request error when the connect nonce is missing.' );
		$this->assertEmpty(
			get_user_option( Hashed_User_ID::OPTION, $current_user_id ),
			'Missing nonce should not result in any Hashed_User_ID being stored.'
		);
	}

	public function test_returns_error_redirect_when_connect_nonce_invalid() {
		$current_user_id = $this->factory()->user->create();
		wp_set_current_user( $current_user_id );

		$_POST['connect_nonce'] = 'invalid';

		$expected = add_query_arg( Existing_User_Authenticator::ERROR_QUERY_ARG, Authenticator::ERROR_INVALID_REQUEST, get_edit_user_link( $current_user_id ) );
		$actual   = $this->do_authenticate_user( self::$payload, false );

		$this->assertEquals( $expected, $actual, 'Should redirect with invalid-request error when the connect nonce is invalid.' );
		$this->assertEmpty(
			get_user_option( Hashed_User_ID::OPTION, $current_user_id ),
			'Invalid nonce should not result in any Hashed_User_ID being stored.'
		);
	}
}
