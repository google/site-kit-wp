<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\Module_Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules\Tags
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules\Tags;

use Google\Site_Kit\Tests\Core\Modules\Tags\FakeModule_Web_Tag;
use Google\Site_Kit\Tests\TestCase;

class Module_Web_TagTest extends TestCase {

	private $web_tag;

	private $module_slug;

	public function set_up() {
		parent::set_up();

		$this->module_slug = 'fake-module';
		$this->web_tag     = new FakeModule_Web_Tag( 'test-tag-id', $this->module_slug );
	}

	public function test_is_tag_blocked() {
		// Tag is not blocked by default.
		$this->assertFalse( $this->web_tag->is_tag_blocked(), 'Web tag should not be blocked without filter.' );

		add_filter( "googlesitekit_{$this->module_slug}_tag_blocked", '__return_true' );

		$this->assertTrue( $this->web_tag->is_tag_blocked(), 'Web tag blocked filter should block tag.' );

		// The return value of the filter is cast to a boolean before returning.
		add_filter( "googlesitekit_{$this->module_slug}_tag_blocked", '__return_empty_string' );
		$this->assertFalse( $this->web_tag->is_tag_blocked(), 'Web tag blocked filter should cast empty value to false.' );
	}

	public function test_get_tag_blocked_on_consent_attribute() {
		// Returns empty string by default.
		$this->assertEquals( '', $this->web_tag->get_tag_blocked_on_consent_attribute(), 'Web tag should omit consent block attribute by default.' );

		// Returns attributes to prevent script loading if truthy.
		add_filter( "googlesitekit_{$this->module_slug}_tag_block_on_consent", '__return_true' );

		$this->assertEquals( ' type="text/plain" data-block-on-consent', $this->web_tag->get_tag_blocked_on_consent_attribute(), 'Web tag should add script-blocking consent attributes.' );
	}
}
