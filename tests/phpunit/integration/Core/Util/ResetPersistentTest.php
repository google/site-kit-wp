<?php
/**
 * ResetPersistentTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Reset_Persistent;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class ResetPersistentTest extends TestCase {

	public function test_all() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_mode() );
		update_option( 'googlesitekitpersistentkeep', 'keep' );
		update_option( 'googlesitekitpersistent-keep', 'keep' );

		$this->run_reset( $context );

		// Ensure options that don't start with googlesitekitpersistent_ are not deleted.
		$this->assertEquals( 'keep', get_option( 'googlesitekitpersistentkeep' ) );
		$this->assertEquals( 'keep', get_option( 'googlesitekitpersistent-keep' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_all() {
		$this->network_activate_site_kit();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_mode() );

		$this->run_reset( $context );
	}

	protected function run_reset( Context $context ) {
		wp_load_alloptions();
		$this->assertNotFalse( wp_cache_get( 'alloptions', 'options' ) );
		$reset = new Reset_Persistent( $context );
		$reset->all();

		// Ensure options cache is flushed (must check before accessing other options as this will re-prime the cache)
		$this->assertFalse( wp_cache_get( 'alloptions', 'options' ) );
	}
}
