<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Ad_Blocking_Recovery_Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Web_Tag;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group AdSense
 */
class Ad_Blocking_Recovery_Web_TagTest extends TestCase {

	public function test_renders_nothing_when_tag_is_not_available() {
		$tag                          = new Ad_Blocking_Recovery_Tag( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$ad_blocking_recovery_web_tag = new Ad_Blocking_Recovery_Web_Tag( $tag, true );

		remove_all_actions( 'wp_head' );

		$ad_blocking_recovery_web_tag->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertEmpty( $output );
	}

	public function test_renders_tags() {
		$tag                          = new Ad_Blocking_Recovery_Tag( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$ad_blocking_recovery_web_tag = new Ad_Blocking_Recovery_Web_Tag( $tag, true );

		remove_all_actions( 'wp_head' );

		$tag->set(
			array(
				'tag'                   => 'test-tag',
				'error_protection_code' => 'test-error-protection-code',
			)
		);

		$ad_blocking_recovery_web_tag->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery snippet added by Site Kit', $output );
		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', $output );
		$this->assertStringContainsString( 'test-tag', $output );
		$this->assertStringContainsString( 'test-error-protection-code', $output );
	}

	public function test_does_not_render_error_protection_tag_when_disabled() {
		$tag                          = new Ad_Blocking_Recovery_Tag( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$ad_blocking_recovery_web_tag = new Ad_Blocking_Recovery_Web_Tag( $tag, false );

		remove_all_actions( 'wp_head' );

		$tag->set(
			array(
				'tag'                   => 'test-tag',
				'error_protection_code' => 'test-error-protection-code',
			)
		);

		$ad_blocking_recovery_web_tag->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery snippet added by Site Kit', $output );
		$this->assertStringNotContainsString( 'Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', $output );
		$this->assertStringContainsString( 'test-tag', $output );
		$this->assertStringNotContainsString( 'test-error-protection-code', $output );
	}
}
