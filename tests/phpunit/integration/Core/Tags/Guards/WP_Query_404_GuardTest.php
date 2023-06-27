<?php
/**
 * WP_Query_404_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Guards
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Guards;

use Google\Site_Kit\Core\Tags\Guards\WP_Query_404_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group test
 */
class WP_Query_404_GuardTest extends TestCase {

	/**
	 * Tag_Guard object.
	 *
	 * @var WP_Query_404_Guard
	 */
	private $guard;

	public function set_up() {
		parent::set_up();
		$this->guard = new WP_Query_404_Guard();
	}

	public function test_can_activate() {
		$this->go_to( '/' );

		$this->assertQueryTrue( 'is_home', 'is_front_page' );
		$this->assertTrue( $this->guard->can_activate(), 'Should return TRUE when the current page exists (is_home).' );
	}

	public function test_cant_activate_on_404() {
		$this->go_to( '/?p=123456789' );

		$this->assertQueryTrue( 'is_404' );
		$this->assertFalse( $this->guard->can_activate(), 'Should return FALSE when the current page doesnt exist (is_404).' );
	}

}
