<?php
/**
 * Google_URL_Matcher_TraitTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Auto_Updates;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Auto_UpdatesTest extends TestCase {
	public function test_sitekit_autoupdate_forced() {
		// Forced auto updates are available for WP >= 5.6 only.
		if ( version_compare( get_bloginfo( 'version' ), '5.6', '<' ) ) {
			return;
		}

		// Is null by default.
		$this->assertSame( Auto_Updates::AUTO_UPDATE_NOT_FORCED, Auto_Updates::sitekit_forced_autoupdates_status() );

		// force enable plugin autoupdates should return true
		add_filter( 'auto_update_plugin', '__return_true' );

		$this->assertSame( Auto_Updates::AUTO_UPDATE_FORCED_ENABLED, Auto_Updates::sitekit_forced_autoupdates_status() );
		$this->assertTrue( Auto_Updates::is_sitekit_autoupdates_enabled() );

		// force disable plugin autoupdates should return false
		remove_filter( 'auto_update_plugin', '__return_true' );
		add_filter( 'auto_update_plugin', '__return_false' );

		$this->assertSame( Auto_Updates::AUTO_UPDATE_FORCED_DISABLED, Auto_Updates::sitekit_forced_autoupdates_status() );
		$this->assertFalse( Auto_Updates::is_plugin_autoupdates_enabled() );
		$this->assertFalse( Auto_Updates::is_sitekit_autoupdates_enabled() );

		// cleanup
		remove_filter( 'auto_update_plugin', '__return_false' );
	}

	public function test_sitekit_autoupdates_disabled() {
		// Forced auto updates are available for WP >= 5.6 only.
		if ( ! self::auto_updates_available() ) {
			return;
		}

		$this->assertFalse( Auto_Updates::is_sitekit_autoupdates_enabled() );

		update_site_option( 'auto_update_plugins', array( 'other-plugin.php' ) );

		$this->assertFalse( Auto_Updates::is_sitekit_autoupdates_enabled() );
	}

	public function test_sitekit_autoupdates_enabled() {
		// Forced auto updates are available for WP >= 5.6 only.
		if ( ! self::auto_updates_available() ) {
			return;
		}

		update_site_option( 'auto_update_plugins', array( 'other-plugin.php', GOOGLESITEKIT_PLUGIN_BASENAME ) );

		$this->assertTrue( Auto_Updates::is_sitekit_autoupdates_enabled() );
	}

	/**
	 * Verify if auto-updates are available for the current WordPress version.
	 */
	private function auto_updates_available() {
		return version_compare( get_bloginfo( 'version' ), '5.5', '>=' );
	}
}

