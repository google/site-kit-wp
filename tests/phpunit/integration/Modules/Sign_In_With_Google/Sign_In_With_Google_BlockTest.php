<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Sign_In_With_Google_BlockTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Sign_In_With_Google\Sign_In_With_Google_Block;
use Google\Site_Kit\Tests\TestCase;

class Sign_In_With_Google_BlockTest extends TestCase {

	/**
	 * Block instance.
	 *
	 * @var Sign_In_With_Google_Block
	 */
	private $block;

	/**
	 * Module instance.
	 *
	 * @var Sign_In_With_Google
	 */
	private $module;

	public function set_up() {
		parent::set_up();

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->block  = new Sign_In_With_Google_Block( $context );
		$this->module = new Sign_In_With_Google( $context );

		add_action(
			'googlesitekit_render_sign_in_with_google_button',
			array( $this->module, 'render_sign_in_with_google_button' ),
			10,
			1
		);
	}

	public function tear_down() {
		remove_action(
			'googlesitekit_render_sign_in_with_google_button',
			array( $this->module, 'render_sign_in_with_google_button' ),
			10
		);

		parent::tear_down();
	}

	public function test_render_callback_with_overrides() {
		wp_set_current_user( 0 );

		$output = $this->block->render_callback(
			array(
				'shape'           => 'pill',
				'text'            => 'signin_with',
				'theme'           => 'filled_black',
				'buttonClassName' => 'custom-class another-class invalid@class',
			)
		);

		$this->assertStringContainsString( 'data-googlesitekit-siwg-shape="pill"', $output, 'Expected shape data attribute to be present.' );
		$this->assertStringContainsString( 'data-googlesitekit-siwg-text="signin_with"', $output, 'Expected text data attribute to be present.' );
		$this->assertStringContainsString( 'data-googlesitekit-siwg-theme="filled_black"', $output, 'Expected theme data attribute to be present.' );
		$this->assertStringContainsString( 'class="googlesitekit-sign-in-with-google__frontend-output-button custom-class another-class invalidclass"', $output, 'Expected sanitized classes to be present.' );
	}

	public function test_render_callback_with_defaults_outputs_no_overrides() {
		wp_set_current_user( 0 );

		$output = $this->block->render_callback(
			array(
				'shape' => '',
				'text'  => '',
				'theme' => '',
			)
		);

		$this->assertStringNotContainsString( 'data-googlesitekit-siwg-shape', $output, 'Default selection should not add shape data attribute.' );
		$this->assertStringNotContainsString( 'data-googlesitekit-siwg-text', $output, 'Default selection should not add text data attribute.' );
		$this->assertStringNotContainsString( 'data-googlesitekit-siwg-theme', $output, 'Default selection should not add theme data attribute.' );
		$this->assertStringContainsString( 'class="googlesitekit-sign-in-with-google__frontend-output-button"', $output, 'Default output should include the base class only.' );
	}
}
