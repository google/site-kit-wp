<?php
/**
 * Class Google\Site_Kit\Tests\Modules\MockMeasurementEventListFactory
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Event_List_Factory;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Woocommerce_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WPForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\CF7_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\FormidableForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\NinjaForms_Event_List;

class MockMeasurementEventListFactory extends Measurement_Event_List_Factory {

	/**
	 * The list of current active plugin configs.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $mock_active_plugins;

	/**
	 * MockMeasurementEventListFactory constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$this->mock_active_plugins = array();
	}

	/**
	 * Returns the current list of active_plugins.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array The list of supported plugins.
	 * @return array Current plugin configuration list.
	 */
	public function get_active_plugin_event_lists( $supported_plugins ) {
		return $this->mock_active_plugins;
	}

	/**
	 * Adds the specified plugin to active plugin list if not already added.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $plugin_name Name of plugin to be added.
	 */
	public function add_active_plugin( $plugin_name ) {
		if ( array_key_exists( $plugin_name, $this->mock_active_plugins) ) {
			return;
		}
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
		if ( null !== $event_list ) {
			$this->mock_active_plugins[$plugin_name] = $event_list;
		}
	}

	/**
	 * Removes the specified plugin from active plugin list.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $plugin_name plugin to be removed.
	 */
	public function remove_active_plugin( $plugin_name ) {
		unset( $this->mock_active_plugins[ $plugin_name ] );
	}
}
