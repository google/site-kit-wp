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
		$this->assertFalse( $context->is_network_mode(), 'Context should not be in network mode by default.' );
		update_option( 'googlesitekitpersistentkeep', 'keep' );
		update_option( 'googlesitekitpersistent-keep', 'keep' );

		$this->run_reset( $context );

		// Ensure options that don't start with googlesitekitpersistent_ are not deleted.
		$this->assertEquals( 'keep', get_option( 'googlesitekitpersistentkeep', 'Option without persistent prefix should be kept.' ), 'Option without persistent prefix should be kept.' );
		$this->assertEquals( 'keep', get_option( 'googlesitekitpersistent-keep', 'Option with dash instead of underscore should be kept.' ), 'Option with dash instead of underscore should be kept.' );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_all() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_mode(), 'Context should be in network mode when filter is enabled.' );

		$this->run_reset( $context );
	}

	protected function run_reset( Context $context ) {
		wp_load_alloptions();
		$this->assertNotFalse( wp_cache_get( 'alloptions', 'options' ), 'Options cache should be loaded.' );
		$reset           = new Reset_Persistent( $context );
		$user_id         = $this->factory()->user->create();
		$is_network_mode = $context->is_network_mode();

		$option_name   = 'googlesitekitpersistent_option';
		$transient_key = 'googlesitekitpersistent_transient';

		if ( $is_network_mode ) {
			update_network_option( null, $option_name, "test-{$option_name}-value" );
			update_user_meta( $user_id, $option_name, "test-{$option_name}-value" );
			set_site_transient( $transient_key, "test-{$transient_key}-value" );
		} else {
			update_option( $option_name, 'test-foo-value' );
			update_user_option( $user_id, $option_name, "test-{$option_name}-value" );
			set_transient( $transient_key, "test-{$transient_key}-value" );
		}
		$reset->all();

		// Ensure options cache is flushed (must check before accessing other options as this will re-prime the cache)
		$this->assertFalse( wp_cache_get( 'alloptions', 'options' ), 'Options cache should be flushed after reset.' );

		if ( $is_network_mode ) {
			remove_all_filters( "default_site_option_$option_name" );
			$this->assertFalse( get_network_option( null, $option_name ), 'Network option should be deleted after reset.' );
			$this->assertFalse( metadata_exists( 'user', $user_id, $option_name ), 'User meta should be deleted after reset.' );
			$this->assertFalse( get_site_transient( $transient_key ), 'Site transient should be deleted after reset.' );
		} else {
			remove_all_filters( "default_option_$option_name" );
			$this->assertFalse( get_option( $option_name ), 'Option should be deleted after reset.' );
			$this->assertFalse( get_user_option( $option_name, $user_id ), 'User option should be deleted after reset.' );
			$this->assertFalse( get_transient( $transient_key ), 'Transient should be deleted after reset.' );
		}
	}
}
