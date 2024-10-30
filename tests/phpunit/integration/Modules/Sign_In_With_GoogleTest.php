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
use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Validate_Auth_Request;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google_Client;
use WP_Error;
use WP_Query;

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

	public function set_up() {
		parent::set_up();
		$this->module = new Sign_In_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_magic_methods() {
		$this->assertEquals( Sign_In_With_Google::MODULE_SLUG, $this->module->slug );
		$this->assertEquals( 'Sign in with Google', $this->module->name );
		$this->assertEquals( 'https://developers.google.com/identity/gsi/web/guides/overview', $this->module->homepage );
		$this->assertEquals( 'Improve user engagement, trust, and data privacy, while creating a simple, secure, and personalized experience for your visitors', $this->module->description );
		$this->assertEquals( 10, $this->module->order );
	}

	public function test_handle_google_auth() {
		global $wp_query;
		$this->module->register();

		$wp_query = new WP_Query();
		$wp_query->query( array( 'google_auth' => 123 ) );

		// Should redirect with no_client_id error if no clientID set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error no_client_id' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'no_client_id', $params['error'] );
		}

		// Should redirect with returned errors from Validate_Auth_Request.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );

		$mock_validate_auth_request = $this->getMockBuilder( Validate_Auth_Request::class )
		->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
		->setMethods( array( 'get_error' ) )
		->getMock();

		$mock_validate_auth_request->method( 'get_error' )
		->willReturn( new WP_Error( 'test_error_type' ) );
		$this->force_set_property( $this->module, 'validate_auth_request', $mock_validate_auth_request );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error test_error_type' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'test_error_type', $params['error'] );
		}

		// Should redirect with google_auth_invalid_request error if payload is empty.
		$mock_input = $this->getMockBuilder( Input::class )
		->setMethods( array( 'filter' ) )
		->getMock();
		$mock_input->method( 'filter' )
		->willReturn( '123456789' );
		$this->force_set_property( $this->module, 'context', new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, $mock_input ) );

		$mock_validate_auth_request = $this->getMockBuilder( Validate_Auth_Request::class )
		->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, $mock_input ) ) )
		->setMethods( array( 'get_error' ) )
		->getMock();

		$mock_validate_auth_request->method( 'get_error' )
		->willReturn( null );
		$this->force_set_property( $this->module, 'validate_auth_request', $mock_validate_auth_request );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn( array() );
		$this->force_set_property( $this->module, 'client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error google_auth_invalid_request' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_invalid_request', $params['error'] );
		}

		// Should redirect with google_auth_invalid_request error if payload is missing email.
		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn( array( 'sub' => '1111111111' ) );
		$this->force_set_property( $this->module, 'client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error google_auth_invalid_request' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_invalid_request', $params['error'] );
		}

		// Should redirect with google_auth_invalid_request error if payload is missing sub.
		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn( array( 'email' => 'testemail@example.com' ) );
		$this->force_set_property( $this->module, 'client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error google_auth_invalid_request' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'google_auth_invalid_request', $params['error'] );
		}

		// Should login existing user with matching Google user ID.
		$wp_user = $this->factory()->user->create_and_get(
			array(
				'user_login' => 'testuser',
				'user_email' => 'testsiwg@example.com',
			)
		);
		add_user_meta( $wp_user->ID, Sign_In_With_Google::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION, '1111111111', true );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'   => '1111111111',
				'email' => 'testsiwg@example.com',
			)
		);
		$this->force_set_property( $this->module, 'client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to dashboard' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( 'http://example.org/wp-admin/', $redirect_url );
		}

		$this->assertEquals( $wp_user->ID, get_current_user_id() );
		$this->assertEquals( '1111111111', get_user_meta( get_current_user_id(), Sign_In_With_Google::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION, true ) );
		$this->assertEquals( 1, did_action( 'wp_login' ) );
		wp_logout();

		// Should login existing user with matching Google ID regardless of email.
		$wp_user1 = $this->factory()->user->create_and_get(
			array(
				'user_login' => 'testuser1',
				'user_email' => 'testsiwg1@example.com',
			)
		);
		add_user_meta( $wp_user1->ID, Sign_In_With_Google::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION, '2222222222', true );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'   => '2222222222',
				'email' => 'testsiwgdifferentemail@example.com',
			)
		);
		$this->force_set_property( $this->module, 'client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to dashboard' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( 'http://example.org/wp-admin/', $redirect_url );
		}

		$this->assertEquals( $wp_user1->ID, get_current_user_id() );
		$this->assertEquals( '2222222222', get_user_meta( get_current_user_id(), Sign_In_With_Google::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION, true ) );
		wp_logout();

		// Creates new user if "Anyone can register" setting is enabled.
		update_option( 'users_can_register', true );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'   => '3333333333',
				'email' => 'testsiwg3@example.com',
			)
		);
		$this->force_set_property( $this->module, 'client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to dashboard' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			$this->assertEquals( 'http://example.org/wp-admin/', $redirect_url );
		}

		$new_user = get_user_by( 'email', 'testsiwg3@example.com' );
		$this->assertEquals( 'testsiwg3@example.com', $new_user->user_login );
		$this->assertEquals( '3333333333', get_user_meta( get_current_user_id(), Sign_In_With_Google::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION, true ) );

		// Does not create new user if "Anyone can register" setting is disabled and will redirect to login with error user_actions_failed.
		update_option( 'users_can_register', false );

		$mock_google_client = $this->createMock( Google_Client::class );
		$mock_google_client->method( 'verifyIdToken' )
		->willReturn(
			array(
				'sub'   => '4444444444',
				'email' => 'testsiwg4@example.com',
			)
		);
		$this->force_set_property( $this->module, 'client', $mock_google_client );

		try {
			$this->module->handle_google_auth();
			$this->fail( 'Expected redirection to login with error registration_disabled' );
		} catch ( RedirectException $e ) {
			$redirect_url = $e->get_location();
			wp_parse_str( parse_url( $redirect_url, PHP_URL_QUERY ), $params );
			$this->assertEquals( 'registration_disabled', $params['error'] );
		}
		// Check the user was not created and the meta not stored.
		$this->assertFalse( get_user_by( 'email', 'testsiwg4@example.com' ) );
		$matching_user = get_users(
			array(
				'meta_key'   => Sign_In_With_Google::SIGN_IN_WITH_GOOGLE_USER_ID_OPTION,
				'meta_value' => '4444444444',
				'number'     => 1,
			)
		);
		$this->assertEmpty( $matching_user );
		wp_logout();

		wp_delete_user( $wp_user->ID );
		wp_delete_user( $wp_user1->ID );
		wp_delete_user( $new_user->ID );
	}
	private function render_signin_button_by_action() {
		ob_start();
		do_action( 'login_form' );
		$output = ob_get_contents();
		ob_end_clean();
		return $output;
	}

	public function test_render_signin_button() {
		$reset_site_url = site_url();
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );

		$this->module->register();

		// Does not render the if the site is not https.
		$this->module->get_settings()->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );
		$output = $this->render_signin_button_by_action();
		$this->assertEmpty( $output );

		// Update site URL to https.
		$_SERVER['HTTPS'] = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if clientID is not set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		$output = $this->render_signin_button_by_action();
		$this->assertEmpty( $output );

		$this->module->get_settings()->set( array( 'clientID' => null ) );
		$output = $this->render_signin_button_by_action();
		$this->assertEmpty( $output );

		// Renders the button with the correct clientID and redirect_uri.
		$this->module->get_settings()->set(
			array(
				'clientID' => '1234567890.googleusercontent.com',
				'text'     => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE,
				'theme'    => Sign_In_With_Google_Settings::THEME_LIGHT,
				'shape'    => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR,
			)
		);

		// Render the button.
		$output = $this->render_signin_button_by_action();

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );

		$this->assertStringContainsString( "client_id: '1234567890.googleusercontent.com'", $output );
		$this->assertStringContainsString( "login_uri: 'https://example.com/wp-login.php?action=google_auth'", $output );

		$this->assertStringContainsString( "text: '" . Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE . "'", $output );
		$this->assertStringContainsString( "theme: '" . Sign_In_With_Google_Settings::THEME_LIGHT . "'", $output );
		$this->assertStringContainsString( "shape: '" . Sign_In_With_Google_Settings::SHAPE_RECTANGULAR . "'", $output );

		// Revert home and siteurl and https value.
		update_option( 'home', $reset_site_url );
		update_option( 'siteurl', $reset_site_url );
		unset( $_SERVER['HTTPS'] );
	}
}
