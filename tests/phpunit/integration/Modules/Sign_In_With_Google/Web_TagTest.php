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
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;
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
		'text'             => Sign_In_With_Google_Settings::TEXT_SIGN_IN_WITH_GOOGLE['value'],
		'theme'            => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
		'shape'            => 'rectangular',
		'oneTapEnabled'    => false,
		'oneTapOnAllPages' => false,
	);

	public function set_up() {
		parent::set_up();

		$this->web_tag = new Web_Tag(
			'test-client-id.app.googleusercontent.com',
			'sign-in-with-google'
		);
		$this->web_tag->set_settings( $this->siwg_settings );
		$this->web_tag->register();
	}

	public function test_render_on_wp_footer() {
		// This WordPress core action fails the test with a deprecation notice so removing it temporarily.
		remove_action( 'wp_footer', 'the_block_template_skip_link' );

		$output = $this->capture_action( 'wp_footer' );

		// Check that the Sign in with Google script is rendered.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );
		$this->assertStringContainsString( 'google.accounts.id.initialize', $output );
		$this->assertStringContainsString( 'test-client-id.app.googleusercontent.com', $output );

		// Restore the WordPress action.
		add_action( 'wp_footer', 'the_block_template_skip_link' );
	}

	public function test_render_on_login_footer() {
		$output = $this->capture_action( 'login_footer' );

		// Check that the Sign in with Google script is rendered.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output );
		$this->assertStringContainsString( 'google.accounts.id.initialize', $output );
		$this->assertStringContainsString( 'test-client-id.app.googleusercontent.com', $output );
	}

	public function test_register() {
		$this->web_tag->register();

		// Verify that the hooks are registered.
		$this->assertTrue( has_action( 'wp_footer' ) );
		$this->assertTrue( has_action( 'login_footer' ) );
	}
}
