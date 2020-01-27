<?php
/**
 * TrackingTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Tracking;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class TrackingTest extends TestCase {

	public function test_register() {
		remove_all_filters( 'googlesitekit_inline_base_data' );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_actions( 'init' );
		$tracking = new Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$tracking->register();

		$this->assertTrue( has_filter( 'googlesitekit_inline_base_data' ) );
		$this->assertTrue( has_filter( 'googlesitekit_admin_data' ) );
		$this->assertTrue( has_action( 'init' ) );
	}

	public function test_is_active() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$tracking = new Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->opt_out_from_tracking();

		$this->assertFalse( $tracking->is_active() );

		$this->opt_in_to_tracking();

		$this->assertTrue( $tracking->is_active() );
	}

	protected function opt_in_to_tracking( $network_wide = false ) {
		update_user_option( get_current_user_id(), Tracking::TRACKING_OPTIN_KEY, 1, $network_wide );
	}

	protected function opt_out_from_tracking( $network_wide = false ) {
		update_user_option( get_current_user_id(), Tracking::TRACKING_OPTIN_KEY, 0, $network_wide );
	}
}
