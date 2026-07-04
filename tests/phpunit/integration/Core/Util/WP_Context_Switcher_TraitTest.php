<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\WP_Context_Switcher_TraitTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Tests\Core\Util\WP_Context_Switcher;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class WP_Context_Switcher_TraitTest extends TestCase {

	public function test_with_frontend_context() {
		$this->go_to( '/' );
		$this->assertFalse( is_admin(), 'Should be in frontend context when on home page.' );

		// No need to switch to 'front' context when already in frontend.
		$restore_context = WP_Context_Switcher::with_frontend_context();
		$this->assertFalse( is_admin(), 'Should remain in frontend context when already there.' );
		$restore_context();
		$this->assertFalse( is_admin(), 'Should remain in frontend context after restore.' );

		set_current_screen( 'edit.php' );
		$this->assertTrue( is_admin(), 'Should be in admin context when on edit screen.' );

		// Switch from admin to 'front' context.
		$restore_context = WP_Context_Switcher::with_frontend_context();
		$this->assertFalse( is_admin(), 'Should switch to frontend context from admin.' );
		$restore_context();
		$this->assertTrue( is_admin(), 'Should restore to admin context after switching back.' );
	}
}
