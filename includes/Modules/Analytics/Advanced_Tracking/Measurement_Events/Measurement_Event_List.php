<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Parent class for a specific plugin's event list
 *
 * @class Measurement_Event_List
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
class Measurement_Event_List {

	/**
	 * Container for list of events - intended to be used per plugin
	 *
	 * @since n.e.x.t.
	 * @var Measurement_Event[]
	 */
	private $measurement_events = array();

	/**
	 * Adds a measurement event to the measurement events array
	 *
	 * @since n.e.x.t.
	 *
	 * @param Measurement_Event $e The measurement event object.
	 */
	protected function add_event( Measurement_Event $e ) {
		array_push( $this->measurement_events, $e );
	}

	/**
	 * Gets the measurement events array
	 *
	 * @since n.e.x.t.
	 *
	 * @return Measurement_Event[]
	 */
	public function get_events() {
		return $this->measurement_events;
	}
}
