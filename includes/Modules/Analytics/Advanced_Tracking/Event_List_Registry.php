<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Event_List_Registry
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

/**
 * Class for registering third party event lists.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
class Event_List_Registry {

	/**
	 * The list of registered event lists.
	 *
	 * @since n.e.x.t.
	 * @var Event_List[]
	 */
	private $event_lists = array();

	/**
	 * Registers an event list.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Event_List $event_list The event list to be registered.
	 */
	public function register_list( Event_List $event_list ) {
		$this->event_lists[] = $event_list;
	}

	/**
	 * Gets the list of registered event lists.
	 *
	 * @since n.e.x.t.
	 *
	 * @return Event_List[] The list of registered event lists.
	 */
	public function get_lists() {
		return $this->event_lists;
	}
}
