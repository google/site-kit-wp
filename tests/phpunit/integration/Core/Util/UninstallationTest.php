<?php
/**
 * UninstallationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\OptionsTestTrait;
use Google\Site_Kit\Tests\UserOptionsTestTrait;
use Google\Site_Kit\Tests\TransientsTestTrait;

/**
 * @group Util
 */
class UninstallationTest extends TestCase {
	use OptionsTestTrait, UserOptionsTestTrait, TransientsTestTrait;

	public function test_uninstallation() {
		wp_load_alloptions();
		$this->assertNotFalse( wp_cache_get( 'alloptions', 'options' ) );

		$user_id      = $this->factory()->user->create();
		$is_multisite = is_multisite();

		$this->init_option_values( $is_multisite );
		$this->init_user_option_values( $user_id, $is_multisite );
		$this->init_transient_values( $is_multisite );

		// As long as we test uninstallation only once, this should not have any side-effects.
		if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
			define( 'WP_UNINSTALL_PLUGIN', GOOGLESITEKIT_PLUGIN_BASENAME );
		}
		$uninstall_file = plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . 'uninstall.php';
		require $uninstall_file;

		// Ensure options cache is flushed (must check before accessing other options as this will re-prime the cache)
		$this->assertFalse( wp_cache_get( 'alloptions', 'options' ) );
		$this->assertOptionsDeleted( $is_multisite );
		$this->assertUserOptionsDeleted( $user_id, $is_multisite );
		$this->assertTransientsDeleted( $is_multisite );
	}
}
