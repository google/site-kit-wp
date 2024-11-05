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
				'text'     => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'    => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
				'shape'    => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			)
		);

		// Render the button.
		$output = $this->render_signin_button_by_action();

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );

		$this->assertStringContainsString( "client_id: '1234567890.googleusercontent.com'", $output );
		$this->assertStringContainsString( "login_uri: 'https://example.com/wp-login.php?action=google_auth'", $output );

		$this->assertStringContainsString( "text: '" . Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'] . "'", $output );
		$this->assertStringContainsString( "theme: '" . Sign_In_With_Google_Settings::THEME_LIGHT['value'] . "'", $output );
		$this->assertStringContainsString( "shape: '" . Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'] . "'", $output );

		// Revert home and siteurl and https value.
		update_option( 'home', $reset_site_url );
		update_option( 'siteurl', $reset_site_url );
		unset( $_SERVER['HTTPS'] );
	}
}
