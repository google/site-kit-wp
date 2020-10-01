<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

/**
 * Class for containing a specific plugin's tracking event list.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
class Measurement_Event_List {

	/**
	 * Container for list of events - intended to be used per plugin.
	 *
	 * @since n.e.x.t.
	 * @var Measurement_Event[]
	 */
	private $measurement_events = array();

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * Children classes can extend to add dynamic events or collect metadata through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {}

	/**
	 * Adds a measurement event to the measurement events array.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Measurement_Event $event The measurement event object.
	 */
	protected function add_event( Measurement_Event $event ) {
		$this->measurement_events[] = $event;
	}

	/**
	 * Gets the measurement events array.
	 *
	 * @since n.e.x.t.
	 *
	 * @return Measurement_Event[] The list of Measurement_Events for this plugin's list.
	 */
	public function get_events() {
		return $this->measurement_events;
	}
}
