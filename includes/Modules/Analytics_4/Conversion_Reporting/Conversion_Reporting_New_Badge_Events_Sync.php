<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_New_Badge_Events_Sync
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Core\Storage\Transients;

/**
 * Class providing implementation of "new" badge for detected conversion reporting events.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Conversion_Reporting_New_Badge_Events_Sync {

	/**
	 * The detected events transient name.
	 */
	public const NEW_EVENTS_BADGE_TRANSIENT = 'googlesitekit_conversion_reporting_new_badge_events';

	/**
	 * Transients instance.
	 *
	 * @since n.e.x.t
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Transients $transients  Transients instance.
	 */
	public function __construct(
		Transients $transients
	) {
		$this->transients = $transients;
	}

	/**
	 * Saves new events badge to the expirable items.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $new_events New events array.
	 */
	public function sync_new_events_badge( $new_events ) {
		$new_events_badge         = $this->transients->get( self::NEW_EVENTS_BADGE_TRANSIENT );
		$save_new_badge_transient = fn( $events ) => $this->transients->set(
			self::NEW_EVENTS_BADGE_TRANSIENT,
			array(
				'created_at' => time(),
				'events'     => $events,
			),
			7 * DAY_IN_SECONDS
		);

		if ( $new_events_badge ) {
			$new_events_badge_time_existed = time() - $new_events_badge['created_at'];
			// If the transient existed for 3 days or less, prevent scenarios where
			// a new event is detected shortly after (within 1-3 days) the previous events.
			// This avoids shortening the "new badge" time for previous events.
			// Instead, we merge the new events with the previous ones to ensure the user sees all of them.
			if ( $new_events_badge_time_existed <= ( 3 * DAY_IN_SECONDS ) ) {
				$events = array_merge( $new_events_badge['events'], $new_events );

				$save_new_badge_transient( $events );
			}
		} else {
			$save_new_badge_transient( $new_events );
		}
	}
}
