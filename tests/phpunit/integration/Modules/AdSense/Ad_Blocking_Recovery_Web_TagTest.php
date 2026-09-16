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

		$this->assertEmpty( $output, 'Ad blocking recovery markup should not render when no tag data is available.' );
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

		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery snippet added by Site Kit', $output, 'Recovery markup should identify the Site Kit recovery snippet.' );
		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', $output, 'Recovery markup should identify the Site Kit error protection snippet.' );
		$this->assertStringContainsString( 'test-tag', $output, 'Recovery markup should include the configured recovery tag.' );
		$this->assertStringContainsString( 'test-error-protection-code', $output, 'Recovery markup should include configured error protection code.' );
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

		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery snippet added by Site Kit', $output, 'Recovery snippet should still render when error protection is disabled.' );
		$this->assertStringNotContainsString( 'Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', $output, 'Error protection snippet marker should not render when error protection is disabled.' );
		$this->assertStringContainsString( 'test-tag', $output, 'Configured recovery tag should still render when error protection is disabled.' );
		$this->assertStringNotContainsString( 'test-error-protection-code', $output, 'Error protection code should not render when error protection is disabled.' );
	}
}
