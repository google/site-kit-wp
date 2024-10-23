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
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;

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

	public function test_render_signin_button() {
		$reset_site_url = site_url();
		update_option( 'home', 'http://example.com/' );
		update_option( 'siteurl', 'http://example.com/' );

		// Does not render the if the site is not https.
		$this->assertNull( $this->module->render_signin_button() );

		// Update site URL to https.
		$_SERVER['HTTPS'] = 'on'; // Required because WordPress's site_url function check is_ssl which uses this var.
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );

		// Does not render if clientID is not set.
		$this->module->get_settings()->set( array( 'clientID' => '' ) );
		$this->assertNull( $this->module->render_signin_button() );
		$this->module->get_settings()->set( array( 'clientID' => null ) );
		$this->assertNull( $this->module->render_signin_button() );

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
		ob_start();
		$this->module->render_signin_button();
		$output = ob_get_contents();
		ob_end_clean();

		// Test the script and style are enqueued.
		$this->assertTrue( wp_script_is( 'googlesitekit-sign-in-with-google-sign-in-button', 'enqueued' ) );
		$this->assertTrue( wp_style_is( 'googlesitekit-wp-login-css', 'enqueued' ) );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'data-client_id="1234567890.googleusercontent.com"', $output );
		$this->assertStringContainsString( 'data-login_uri="https://example.com/auth/google"', $output );

		$this->assertStringContainsString( 'data-text="' . Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE . '"', $output );
		$this->assertStringContainsString( 'data-theme="' . Sign_In_With_Google_Settings::THEME_LIGHT . '"', $output );
		$this->assertStringContainsString( 'data-shape="' . Sign_In_With_Google_Settings::SHAPE_RECTANGULAR . '"', $output );

		// Revert home and siteurl and https value.
		update_option( 'home', $reset_site_url );
		update_option( 'siteurl', $reset_site_url );
		unset( $_SERVER['HTTPS'] );
	}
}
