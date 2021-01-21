<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

/**
 * Base class representing a tracking event list.
 *
 * @since 1.18.0.
 * @access private
 * @ignore
 */
abstract class Event_List {

	/**
	 * Container for events.
	 *
	 * @since 1.18.0.
	 * @var array Map of events for this list, keyed by their unique ID.
	 */
	private $events = array();

	/**
	 * Adds events or registers WordPress hook callbacks to add events.
	 *
	 * Children classes should extend this to add their events, either generically or by dynamically collecting
	 * metadata through WordPress hooks.
	 *
	 * @since 1.18.0.
	 */
	abstract public function register();

	/**
	 * Adds a measurement event to the measurement events array.
	 *
	 * @since 1.18.0.
	 *
	 * @param Event $event The measurement event object.
	 */
	protected function add_event( Event $event ) {
		$hash                  = md5( wp_json_encode( $event ) );
		$this->events[ $hash ] = $event;
	}

	/**
	 * Gets the measurement events array.
	 *
	 * @since 1.18.0.
	 *
	 * @return array The map of events for this list, keyed by their unique ID.
	 */
	public function get_events() {
		return $this->events;
	}
}
