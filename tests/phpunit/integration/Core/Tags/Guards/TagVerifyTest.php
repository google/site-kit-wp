<?php
/**
 * TagVerifyTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Guards
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Guards;

use Google\Site_Kit\Core\Tags\Guards\TagVerify;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

class TagVerifyTest extends TestCase {

	/**
	 * @var TagVerify
	 */
	private $tagverify;

	public function setUp() {
		parent::setUp();
		$this->tagverify = new TagVerify( new MutableInput() );
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
