<?php
/**
 * DeactivationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Deactivation;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class DeactivationTest extends TestCase {

	public function test_register() {
		$deactivation    = new Deactivation();
		remove_all_actions( 'googlesitekit_deactivation' );

		wp_schedule_event( time(), 'daily', 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) );
		wp_schedule_event( time(), 'hourly', 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) );

		$deactivation->register();
		$this->assertDeactivationActions( $network_wide = false );
	}


	protected function assertDeactivationActions( $network_wide ) {
		do_action( 'googlesitekit_deactivation', $network_wide );

		$this->assertFalse( wp_get_schedule( 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) ) );
		$this->assertFalse( wp_get_schedule( 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) ) );
	}
}
