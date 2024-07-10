<?php
/**
 * Tag_Verify_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Guards
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Guards;

use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

class Tag_Verify_GuardTest extends TestCase {

	/**
	 * @var Tag_Verify_Guard
	 */
	private $tagverify;

	public function set_up() {
		parent::set_up();
		$this->tagverify = new Tag_Verify_Guard( new MutableInput() );
	}

	public function test_can_activate_by_default() {
		// Should return TRUE when "tagverify" isn't set.
		$this->assertTrue( $this->tagverify->can_activate() );
	}

	public function test_can_activate() {
		$negative_values = array( '0', 'off', 'no', 'false' );
		foreach ( $negative_values as $tagverify ) {
			$_GET['tagverify'] = $tagverify;
			$this->assertTrue( $this->tagverify->can_activate(), "Should return TRUE when tagverify has \"{$tagverify}\" value" );
		}
	}

	public function test_cant_activate() {
		$negative_values = array( '1', 'on', 'yes', 'true' );
		foreach ( $negative_values as $tagverify ) {
			$_GET['tagverify'] = $tagverify;
			$this->assertFalse( $this->tagverify->can_activate(), "Should return FALSE when tagverify has \"{$tagverify}\" value" );
		}
	}
}
