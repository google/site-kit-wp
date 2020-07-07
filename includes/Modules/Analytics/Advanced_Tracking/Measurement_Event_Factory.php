<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Event_Factory
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Woocommerce_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WPForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\CF7_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\FormidableForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\NinjaForms_Event_List;

/**
 * Produces Measurement_Event objects
 *
 * Class Measurement_Event_Factory
 */
class Measurement_Event_Factory {

	/**
	 * Instantiates a subclass of MeasurementEventList based on the given plugin name
	 *
	 * @param string $plugin_name represents the plugin name to create a list of events for.
	 * @return Measurement_Event_List
	 */
	public function create_measurement_event_list( $plugin_name ) {
		$event_list = null;
		switch ( $plugin_name ) {
			case 'WooCommerce':
				$event_list = new Woocommerce_Event_List();
				break;
			case 'WPForms Lite':
			case 'WPForms':
				$event_list = new WPForms_Event_List();
				break;
			case 'Contact Form 7':
				$event_list = new CF7_Event_List();
				break;
			case 'Formidable Forms':
				$event_list = new FormidableForms_Event_List();
				break;
			case 'Ninja Forms':
				$event_list = new NinjaForms_Event_List();
				break;
		}
		return $event_list;
	}

}
