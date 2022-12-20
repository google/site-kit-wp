<?php
/**
 * Activity_MetricsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Dashboard_Sharing
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Dashboard_Sharing;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Activity_Metrics;
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Active_Consumers;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Activity_MetricsTest extends TestCase {

	public function set_up() {
		parent::set_up();
		$user_id            = $this->factory()->user->create();
		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $this->context, $user_id );
	}

	public function test_get_for_refresh_token() {
		$activity_metrics = new Activity_Metrics( $this->context, $this->user_options );
		$activity_metrics->register();

		$this->assertEmpty( $activity_metrics->get_for_refresh_token() );

		// Setting the value to one ID and one role results in ID and role to be separated by colons.
		$this->set_active_consumers(
			array(
				1 => array( 'a' ),
			)
		);
		$this->assertEquals(
			array( 'active_consumers' => '1:a' ),
			$activity_metrics->get_for_refresh_token()
		);

		// Updating with multiple role results in the roles to be separated by commas.
		$this->set_active_consumers(
			array(
				1 => array( 'a', 'b', 'c' ),
			)
		);
		$this->assertEquals(
			array( 'active_consumers' => '1:a,b,c' ),
			$activity_metrics->get_for_refresh_token()
		);

		// Updating with multiple IDs results in the IDs to be separated by empty spaces.
		$this->set_active_consumers(
			array(
				1 => array( 'a', 'b', 'c' ),
				2 => array( 'x', 'y', 'z' ),
			)
		);
		$this->assertEquals(
			array( 'active_consumers' => '1:a,b,c 2:x,y,z' ),
			$activity_metrics->get_for_refresh_token()
		);
	}

	/**
	 * Sets active consumer to isolate tested method.
	 *
	 * @param mixed $value Value to set.
	 */
	protected function set_active_consumers( $value ) {
		$this->user_options->set( Active_Consumers::OPTION, $value );
	}
}
