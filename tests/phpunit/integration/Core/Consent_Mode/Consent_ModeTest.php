<?php
/**
 * Consent_ModeTest
 *
 * @package   Google\Site_Kit\Tests\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Consent_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Consent_Mode\Consent_Mode;
use Google\Site_Kit\Core\Consent_Mode\Consent_Mode_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

class Consent_ModeTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Consent_Mode instance.
	 *
	 * @var Consent_Mode
	 */
	private $consent_mode;

	public function set_up() {
		parent::set_up();

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $this->context );

		$modules            = new Modules( $this->context );
		$this->consent_mode = new Consent_Mode( $this->context, $modules, $this->options );
	}

	public function test_renders_consent_mode_snippet_when_enabled() {
		remove_all_actions( 'wp_head' );

		( new Consent_Mode_Settings( $this->options ) )->set( array( 'enabled' => true ) );

		$this->consent_mode->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringContainsString( 'Google tag (gtag.js) Consent Mode dataLayer added by Site Kit', $output );
	}

	public function test_does_not_render_consent_mode_snippet_when_disabled() {
		remove_all_actions( 'wp_head' );

		$this->consent_mode->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringNotContainsString( 'Google tag (gtag.js) Consent Mode dataLayer added by Site Kit', $output );
	}

	public function test_register__googlesitekit_consent_mode_status() {
		remove_all_filters( 'googlesitekit_consent_mode_status' );

		$this->consent_mode->register();

		$this->assertTrue( has_filter( 'googlesitekit_consent_mode_status' ) );
	}
}
