<?php

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Parent class for a specific plugin's event list
 *
 * @class Measurement_Event_List
 */
class Measurement_Event_List {

	/**
	 * Container for list of events - intended to be used per plugin
	 *
	 * @var Measurement_Event[]
	 */
	private $measurement_events = array();

	protected function add_event(Measurement_Event $e) {
		array_push($this->measurement_events, $e);
	}

	public function get_events() {
		return $this->measurement_events;
	}

}
