<?php
/**
 * Current_ScreenTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Current_Screen;
use Google\Site_Kit\Tests\TestCase;
use WP_Screen;

/**
 * @group Util
 */
class Current_ScreenTest extends TestCase {

	public function test_returns_wp_screen_for_profile_screen() {
		set_current_screen( 'profile' );

		$screen = Current_Screen::get();

		$this->assertInstanceOf( WP_Screen::class, $screen, 'Should return a WP_Screen instance when the profile screen is active.' );
		$this->assertSame( 'profile', $screen->id, 'Returned screen ID should match the active profile screen.' );
	}

	public function test_returns_wp_screen_for_user_edit_screen() {
		set_current_screen( 'user-edit' );

		$screen = Current_Screen::get();

		$this->assertInstanceOf( WP_Screen::class, $screen, 'Should return a WP_Screen instance when the user-edit screen is active.' );
		$this->assertSame( 'user-edit', $screen->id, 'Returned screen ID should match the active user-edit screen.' );
	}

	public function test_returns_null_when_no_current_screen_is_set() {
		unset( $GLOBALS['current_screen'] );

		$this->assertNull( Current_Screen::get(), 'Should return null when no current screen has been set.' );
	}
}
