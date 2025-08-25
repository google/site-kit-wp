<?php
/**
 * Tracking_ConsentTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tracking
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tracking\Tracking_Consent;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group tracking
 */
class Tracking_ConsentTest extends TestCase {

	public function set_up() {
		parent::set_up();
		// Unregister all registered user meta.
		global $wp_meta_keys;
		unset( $wp_meta_keys['user'] );
	}

	public function test_register() {
		$user_options     = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$tracking_consent = new Tracking_Consent( $user_options );
		$this->assertArrayNotHasKey( $user_options->get_meta_key( Tracking_Consent::OPTION ), get_registered_meta_keys( 'user' ), 'Tracking consent meta should not be registered before register().' );

		$tracking_consent->register();

		$this->assertArrayHasKey( $user_options->get_meta_key( Tracking_Consent::OPTION ), get_registered_meta_keys( 'user' ), 'Tracking consent meta should be registered after register().' );
	}

	public function test_get() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$tracking_consent = new Tracking_Consent( new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->opt_out_from_tracking();

		$this->assertFalse( $tracking_consent->get(), 'Tracking consent should be false when user opted out.' );

		$this->opt_in_to_tracking();

		$this->assertTrue( $tracking_consent->get(), 'Tracking consent should be true when user opted in.' );
	}

	protected function opt_in_to_tracking( $network_wide = false ) {
		update_user_option( get_current_user_id(), Tracking_Consent::OPTION, 1, $network_wide );
	}

	protected function opt_out_from_tracking( $network_wide = false ) {
		update_user_option( get_current_user_id(), Tracking_Consent::OPTION, 0, $network_wide );
	}
}
