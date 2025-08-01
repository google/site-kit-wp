<?php
/**
 * Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Web_Tag;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class Web_TagTest extends TestCase {

	/**
	 * Web_Tag object.
	 *
	 * @var Web_Tag
	 */
	private $web_tag;

	/**
	 * Example settings object.
	 *
	 * @var array
	 */
	private $siwg_settings = array(
		'clientID'         => 'test-client-id.app.googleusercontent.com',
		'text'             => Settings::TEXT_SIGN_IN_WITH_GOOGLE['value'],
		'theme'            => Settings::THEME_LIGHT['value'],
		'shape'            => 'rectangular',
		'oneTapEnabled'    => false,
		'oneTapOnAllPages' => false,
	);

	/**
	 * Initial SCRIPT_NAME.
	 *
	 * @var string
	 */
	private static $initial_script_name;

	public static function set_up_before_class() {
		parent::set_up_before_class();
		self::$initial_script_name = $_SERVER['SCRIPT_NAME'];
	}

	public function set_up() {
		parent::set_up();

		$this->web_tag = new Web_Tag(
			'test-client-id.app.googleusercontent.com',
			'sign-in-with-google'
		);
		$this->web_tag->set_settings( $this->siwg_settings );
	}

	public function tear_down() {
		parent::tear_down();

		$_SERVER['SCRIPT_NAME'] = self::$initial_script_name;
	}

	public function test_render_on_wp_footer() {
		remove_all_actions( 'wp_footer' );
		$_SERVER['SCRIPT_NAME'] = wp_login_url();

		$this->web_tag->register();

		$output = $this->capture_action( 'wp_footer' );

		// Check that the Sign in with Google script is rendered.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );
		$this->assertStringContainsString( 'google.accounts.id.initialize', $output );
		$this->assertStringContainsString( 'test-client-id.app.googleusercontent.com', $output );

		// Renders the button with the correct clientID and redirect_uri.
		$this->web_tag->set_settings(
			array(
				'clientID' => '1234567890.googleusercontent.com',
				'text'     => Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'    => Settings::THEME_LIGHT['value'],
				'shape'    => Settings::SHAPE_RECTANGULAR['value'],
			)
		);

		// Render the button.
		$output = $this->capture_action( 'wp_footer' );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );

		$this->assertStringContainsString( "client_id:'1234567890.googleusercontent.com'", $output );
		$this->assertStringContainsString( "fetch('http://example.org/wp-login.php?action=googlesitekit_auth'", $output );

		$this->assertStringContainsString( sprintf( '"text":"%s"', Settings::TEXT_CONTINUE_WITH_GOOGLE['value'] ), $output );
		$this->assertStringContainsString( sprintf( '"theme":"%s"', Settings::THEME_LIGHT['value'] ), $output );
		$this->assertStringContainsString( sprintf( '"shape":"%s"', Settings::SHAPE_RECTANGULAR['value'] ), $output );

		// The Sign in with Google JS should always render, even on the front
		// page.
		$_SERVER['SCRIPT_NAME'] = '/index.php';
		$output                 = $this->capture_action( 'wp_footer' );

		// The button shouldn't be rendered on a non-login page.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );

		// Enable the Sign in with Google One Tap on all pages.
		$this->web_tag->set_settings(
			array(
				'clientID'         => '1234567890.googleusercontent.com',
				'text'             => Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'            => Settings::THEME_LIGHT['value'],
				'shape'            => Settings::SHAPE_RECTANGULAR['value'],
				'oneTapEnabled'    => true,
				'oneTapOnAllPages' => true,
			)
		);

		// Now the button should be rendered on a non-login page.
		$output = $this->capture_action( 'wp_footer' );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );
	}

	public function test_render_on_login_footer() {
		remove_all_actions( 'login_footer' );

		$this->web_tag->register();

		$output = $this->capture_action( 'login_footer' );

		// Check that the Sign in with Google script is rendered.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );
		$this->assertStringContainsString( 'google.accounts.id.initialize', $output );
		$this->assertStringContainsString( 'test-client-id.app.googleusercontent.com', $output );
	}

	public function test_register() {
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'login_footer' );

		$this->web_tag->register();

		// Verify that the hooks are registered.
		$this->assertTrue( has_action( 'wp_footer' ) );
		$this->assertTrue( has_action( 'login_footer' ) );
	}
}
