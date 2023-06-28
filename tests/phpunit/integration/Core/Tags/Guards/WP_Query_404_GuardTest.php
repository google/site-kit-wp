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

class WP_Query_404_GuardTest extends TestCase {

	public function test_can_activate() {
		$guard = new WP_Query_404_Guard();

		$this->go_to( '/' );

		$this->assertQueryTrue( 'is_home', 'is_front_page' );
		$this->assertTrue( $guard->can_activate(), 'Should return TRUE when the current page exists (is_home).' );
	}

	public function test_cant_activate_on_404() {
		$guard = new WP_Query_404_Guard();

		$this->go_to( '/?p=123456789' );

		$this->assertQueryTrue( 'is_404' );
		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when the current page doesnt exist (is_404).' );
	}

}
