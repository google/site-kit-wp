<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\WP_Context_SwitcherTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\WP_Context_Switcher;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class WP_Context_SwitcherTest extends TestCase {

	public function test_switch_context_front() {
		$this->go_to( '/' );
		$this->assertFalse( is_admin() );

		// No need to switch to 'front' context when already in frontend.
		$this->assertFalse( WP_Context_Switcher::switch_context( WP_Context_Switcher::CONTEXT_FRONT ) );
		$this->assertFalse( is_admin() );
		$this->assertFalse( WP_Context_Switcher::restore_context() );

		set_current_screen( 'edit.php' );
		$this->assertTrue( is_admin() );

		// Switch from admin to 'front' context.
		$this->assertTrue( WP_Context_Switcher::switch_context( WP_Context_Switcher::CONTEXT_FRONT ) );
		$this->assertFalse( is_admin() );
		$this->assertTrue( WP_Context_Switcher::restore_context() );
	}

	public function test_switch_context_admin() {
		$this->go_to( '/' );
		$this->assertFalse( is_admin() );

		// Switch from frontend to 'admin' context.
		$this->assertTrue( WP_Context_Switcher::switch_context( WP_Context_Switcher::CONTEXT_ADMIN ) );
		$this->assertTrue( is_admin() );
		$this->assertTrue( WP_Context_Switcher::restore_context() );

		set_current_screen( 'edit.php' );
		$this->assertTrue( is_admin() );

		// No need to switch to 'admin' context when already in admin.
		$this->assertFalse( WP_Context_Switcher::switch_context( WP_Context_Switcher::CONTEXT_ADMIN ) );
		$this->assertTrue( is_admin() );
		$this->assertFalse( WP_Context_Switcher::restore_context() );
	}
}
