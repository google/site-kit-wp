<?php
/**
 * Auto_UpdatesTest.
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Auto_Updates;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Auto_UpdatesTest extends TestCase {
	/**
	 * Forced auto updates are available for WP >= 5.6 only, so we test
	 * for a function only available in WordPress 5.6 or greater.
	 *
	 * @requires function wp_is_auto_update_forced_for_item
	 */
	public function test_sitekit_autoupdate_forced() {
		// By default, auto updates are not forced to either be enabled
		// or disabled.
		$this->assertSame( Auto_Updates::AUTO_UPDATE_NOT_FORCED, Auto_Updates::sitekit_forced_autoupdates_status() );

		// Force auto-updates to be enabled by a filter.
		add_filter( 'auto_update_plugin', '__return_true' );

		$this->assertSame( Auto_Updates::AUTO_UPDATE_FORCED_ENABLED, Auto_Updates::sitekit_forced_autoupdates_status() );
		$this->assertTrue( Auto_Updates::is_sitekit_autoupdates_enabled() );

		// Force auto-updates to be disabled by a filter.
		remove_filter( 'auto_update_plugin', '__return_true' );
		add_filter( 'auto_update_plugin', '__return_false' );

		$this->assertSame( Auto_Updates::AUTO_UPDATE_FORCED_DISABLED, Auto_Updates::sitekit_forced_autoupdates_status() );
		$this->assertFalse( Auto_Updates::is_plugin_autoupdates_enabled() );
		$this->assertFalse( Auto_Updates::is_sitekit_autoupdates_enabled() );

		remove_filter( 'auto_update_plugin', '__return_false' );
	}

	/**
	 * Auto updates are available for WP >= 5.5 only, so we test
	 * for a function only available in WordPress 5.5 or greater.
	 *
	 * @requires function wp_is_auto_update_enabled_for_type
	 */
	public function test_sitekit_autoupdates_disabled() {
		$this->assertFalse( Auto_Updates::is_sitekit_autoupdates_enabled() );

		update_site_option( 'auto_update_plugins', array( 'other-plugin.php' ) );

		$this->assertFalse( Auto_Updates::is_sitekit_autoupdates_enabled() );
	}

	/**
	 * Auto updates are available for WP >= 5.5 only, so we test
	 * for a function only available in WordPress 5.5 or greater.
	 *
	 * @requires function wp_is_auto_update_enabled_for_type
	 */
	public function test_sitekit_autoupdates_enabled() {
		update_site_option( 'auto_update_plugins', array( 'other-plugin.php', GOOGLESITEKIT_PLUGIN_BASENAME ) );

		$this->assertTrue( Auto_Updates::is_sitekit_autoupdates_enabled() );
	}

	/**
	 * @requires function wp_is_auto_update_forced_for_item
	 * @link https://github.com/google/site-kit-wp/issues/6624
	 */
	public function test_sitekit_forced_autoupdates_status() {
		$spy = new MethodSpy();
		add_filter( 'auto_update_plugin', array( $spy, 'callback' ), 10, 2 );

		Auto_Updates::sitekit_forced_autoupdates_status();

		$this->assertCount( 1, $spy->invocations['callback'] );
		list( $update, $item ) = $spy->invocations['callback'][0];
		$this->assertNull( $update );
		$this->assertIsObject( $item );
	}
}

