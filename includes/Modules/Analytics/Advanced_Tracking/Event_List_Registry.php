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

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event_List;

/**
 * Class for registering third party event lists.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
class Event_List_Registry {

	/**
	 * The list of active event lists.
	 *
	 * @since n.e.x.t.
	 * @var Measurement_Event_List[]
	 */
	private $active_event_lists;

	/**
	 * Event_List_Registry constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {}

	/**
	 * Registers a third party event lists.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Measurement_Event_List $event_list The third party event list to be registered.
	 */
	public function register( Measurement_Event_List $event_list ) {}

}
