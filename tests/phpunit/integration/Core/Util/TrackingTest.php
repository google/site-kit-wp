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
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		remove_all_actions( 'googlesitekit_enqueue_screen_assets' );
		remove_all_actions( 'admin_enqueue_scripts' );
		$tracking = new Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$tracking->register();

		$this->assertGtagScriptPrinted( 'googlesitekit_enqueue_screen_assets' );
		$this->assertAdditionalScreensPrintGtag();
	}

	protected function assertGtagScriptPrinted( $action ) {
		$this->opt_out_from_tracking();

		$this->assertNotContains(
			'https://www.googletagmanager.com/gtag/js?id=' . Tracking::TRACKING_ID,
			$this->capture_action( $action )
		);

		$this->opt_in_to_tracking();

		$this->assertContains(
			'https://www.googletagmanager.com/gtag/js?id=' . Tracking::TRACKING_ID,
			$this->capture_action( $action )
		);
	}

	protected function assertAdditionalScreensPrintGtag() {
		$tracking_id = Tracking::TRACKING_ID;
		set_current_screen( 'test-screen' );
		$this->assertEmpty( $this->capture_action( 'admin_enqueue_scripts' ) );

		set_current_screen( 'dashboard' );
		$this->assertGtagScriptPrinted( 'admin_enqueue_scripts' );
		$this->assertContains( "send_to: '$tracking_id'", $this->capture_action( 'admin_enqueue_scripts' ) );

		set_current_screen( 'plugins' );
		$this->assertGtagScriptPrinted( 'admin_enqueue_scripts' );
		$this->assertContains( "send_to: '$tracking_id'", $this->capture_action( 'admin_enqueue_scripts' ) );

		set_current_screen( 'test-screen' );
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
