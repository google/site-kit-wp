<?php
/**
 * Conversion_Reporting_New_Badge_Events_SyncTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Events_Sync;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_New_Badge_Events_Sync;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Conversion_Reporting
 */
class Conversion_Reporting_New_Badge_Events_SyncTest extends TestCase {
	use Fake_Site_Connection_Trait;

	/**
	 * @var Context $context Context instance.
	 */
	private $context;

	/**
	 * @var Conversion_Reporting_New_Badge_Events_Sync $new_badge_events_sync Conversion_Reporting_New_Badge_Events_Sync instance.
	 */
	private $new_badge_events_sync;

	/**
	 * @var Transients $transients Transients instance.
	 */
	private $transients;

	public function set_up() {
		parent::set_up();

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->transients = new Transients( $context );

		$this->new_badge_events_sync = new Conversion_Reporting_New_Badge_Events_Sync( $this->transients );
	}

	public function sync_new_events_badge__no_transient_exists() {
		$this->transients->delete( Conversion_Reporting_New_Badge_Events_Sync::NEW_EVENTS_BADGE_TRANSIENT );
		$new_events = array( 'event1', 'event2' );

		$this->new_badge_events_sync->sync_new_events_badge( $new_events );

		$result = $this->transients->get( Conversion_Reporting_New_Badge_Events_Sync::NEW_EVENTS_BADGE_TRANSIENT );

		$this->assertNotEmpty( $result );
		$this->assertArrayHasKey( 'created_at', $result );
		$this->assertArrayHasKey( 'events', $result );
		$this->assertEquals( $new_events, $result['events'] );
	}

	public function sync_new_events_badge__transient_younger_than_3_days() {
		$existing_events = array( 'event1' );
		$new_events      = array( 'event2' );

		// Set transient as existing for 2 days.
		$this->transients->set(
			Conversion_Reporting_New_Badge_Events_Sync::NEW_EVENTS_BADGE_TRANSIENT,
			array(
				'created_at' => time() - ( 2 * DAY_IN_SECONDS ),
				'events'     => $existing_events,
			),
			7 * DAY_IN_SECONDS
		);

		$this->new_badge_events_sync->sync_new_events_badge( $new_events );

		$result = $this->transients->get( Conversion_Reporting_New_Badge_Events_Sync::NEW_EVENTS_BADGE_TRANSIENT );

		$this->assertNotEmpty( $result );
		$this->assertEquals(
			array_merge( $existing_events, $new_events ),
			$result['events']
		);
	}

	public function sync_new_events_badge__transient_older_than_3_days() {
		$existing_events = array( 'event1' );
		$new_events      = array( 'event2' );

		// Set transient as existing for 4 days.
		$this->transients->set(
			Conversion_Reporting_New_Badge_Events_Sync::NEW_EVENTS_BADGE_TRANSIENT,
			array(
				'created_at' => time() - ( 4 * DAY_IN_SECONDS ),
				'events'     => $existing_events,
			),
			7 * DAY_IN_SECONDS
		);

		$this->new_badge_events_sync->sync_new_events_badge( $new_events );

		$result = $this->transients->get( Conversion_Reporting_New_Badge_Events_Sync::NEW_EVENTS_BADGE_TRANSIENT );

		$this->assertNotEmpty( $result );
		$this->assertEquals( $new_events, $result['events'] );
	}
}
