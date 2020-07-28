<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Event_List_Factory
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
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
 * Class for detecting active plugins on a user's site and producing event lists.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
class Measurement_Event_List_Factory {

	/**
	 * The constant check_type string for support_plugins array in the Advanced_Tracking class.
	 *
	 * @since n.e.x.t.
	 * @var string
	 */
	const TYPE_CONSTANT = 'CONSTANT';

	/**
	 * The function check_type string for support_plugins array in the Advanced_Tracking class.
	 *
	 * @since n.e.x.t.
	 * @var string
	 */
	const TYPE_FUNCTION = 'FUNCTION';

	/**
	 * Determines the user's current active plugins that Advanced_Tracking supports.
	 *
	 * @since n.e.x.t.
	 *
	 * @param  array $supported_plugins The list of supported plugins.
	 * @return array $active_plugins The list of active plugin event lists.
	 */
	public function get_active_plugin_event_lists( $supported_plugins ) {
		$active_plugins = array_filter(
			$supported_plugins,
			function( $plugin_config ) {
				if ( self::TYPE_CONSTANT === $plugin_config['check_type'] && defined( $plugin_config['check_name'] ) ) { // phpcs:ignore WordPressVIPMinimum.Constants.ConstantString.NotCheckingConstantName
					return true;
				}
				if ( self::TYPE_FUNCTION === $plugin_config['check_type'] && function_exists( $plugin_config['check_name'] ) ) {
					return true;
				}
				return false;
			}
		);
		$plugin_names   = array_keys( $active_plugins );
		foreach ( $plugin_names as $plugin_name ) {
			$active_plugins[ $plugin_name ] = $this->produce_plugin_event_list( $plugin_name );
		}
		return $active_plugins;
	}

	/**
	 * Instantiates an event list given a plugin name.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $plugin_name The plugin's name to instantiate an event list for.
	 * @return Measurement_Event_List|null $event_list The instantiated event list.
	 */
	private function produce_plugin_event_list( $plugin_name ) {
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
		$event_list->register();
		return $event_list;
	}
}
