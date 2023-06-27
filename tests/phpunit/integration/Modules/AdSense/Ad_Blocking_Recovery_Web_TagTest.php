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
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Web_Tag;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group AdSense
 * @group test
 */
class Ad_Blocking_Recovery_Web_TagTest extends TestCase {

	/**
	 * Ad_Blocking_Recovery_Tag object.
	 * @var Ad_Blocking_Recovery_Tag
	 */
	private $tag;

	/**
	 * Ad_Blocking_Recovery_Web_Tag object.
	 *
	 * @var Ad_Blocking_Recovery_Web_Tag
	 */
	private $web_tag;

	public function set_up() {
		parent::set_up();

		$this->tag     = new Ad_Blocking_Recovery_Tag( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->web_tag = new Ad_Blocking_Recovery_Web_Tag( 'test-id', AdSense::MODULE_SLUG );
		$this->web_tag->set_ad_blocking_recovery_tag( $this->tag );
		$this->web_tag->set_use_error_snippet( true );
	}

	public function test_renders_nothing_when_not_available() {
		remove_all_actions( 'wp_head' );

		$this->web_tag->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertEmpty( $output );
	}

	public function test_renders_tags() {
		remove_all_actions( 'wp_head' );

		$this->tag->set(
			array(
				'tag'                   => 'test-tag',
				'error_protection_code' => 'test-error-protection-code',
			)
		);

		$this->web_tag->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery snippet added by Site Kit', $output );
		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', $output );
		$this->assertStringContainsString( 'test-tag', $output );
		$this->assertStringContainsString( 'test-error-protection-code', $output );

	}

	public function test_does_nt_render_error_protection_tag_when_disabled() {
		remove_all_actions( 'wp_head' );

		$this->tag->set(
			array(
				'tag'                   => 'test-tag',
				'error_protection_code' => 'test-error-protection-code',
			)
		);
		$this->web_tag->set_use_error_snippet( false );

		$this->web_tag->register();

		$output = $this->capture_action( 'wp_head' );

		$this->assertStringContainsString( 'Google AdSense Ad Blocking Recovery snippet added by Site Kit', $output );
		$this->assertStringNotContainsString( 'Google AdSense Ad Blocking Recovery Error Protection snippet added by Site Kit', $output );
		$this->assertStringContainsString( 'test-tag', $output );
		$this->assertStringNotContainsString( 'test-error-protection-code', $output );

	}
}
