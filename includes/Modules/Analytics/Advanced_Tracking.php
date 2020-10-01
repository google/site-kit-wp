<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Event_List_Registry;

/**
 * Class for Google Analytics Advanced Event Tracking.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Advanced_Tracking {

	/**
	 * List of plugins Site Kit supports for event tracking.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $supported_plugins;


	/**
	 * List of event configurations to be tracked.
	 *
	 * @since n.e.x.t.
	 * @var Measurement_Event[]
	 */
	private $event_configurations;

	/**
	 * Main class event list registry instance.
	 *
	 * @since n.e.x.t.
	 * @var Event_List_Registry
	 */
	private $event_list_registry;

	/**
	 * Advanced_Tracking constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$this->event_list_registry = new Event_List_Registry();
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_action(
			'googlesitekit_analytics_init_tag',
			function() {
				$this->register_event_lists();
				add_action(
					'wp_footer',
					function() {
						$this->set_up_advanced_tracking();
					}
				);
			}
		);
		add_action(
			'googlesitekit_analytics_init_tag_amp',
			function() {
				$this->register_event_lists();
				add_filter(
					'googlesitekit_amp_gtag_opt',
					function( $gtag_amp_opt ) {
						return $this->set_up_advanced_tracking_amp( $gtag_amp_opt );
					}
				);
			}
		);
	}

	/**
	 * Injects javascript to track active events.
	 *
	 * @since n.e.x.t.
	 */
	private function set_up_advanced_tracking() {
		$this->compile_events();
		( new Measurement_Code_Injector() )->inject_event_tracking( $this->event_configurations );
	}

	/**
	 * Adds triggers to AMP configuration.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $gtag_amp_opt gtag config options for AMP.
	 * @return array $gtag_amp_opt gtag config options for AMP.
	 */
	private function set_up_advanced_tracking_amp( $gtag_amp_opt ) {
		$this->compile_events();

		if ( ! array_key_exists( 'triggers', $gtag_amp_opt ) ) {
			$gtag_amp_opt['triggers'] = array();
		}
		foreach ( $this->event_configurations as $event_config ) {
			$gtag_amp_opt['triggers'][ $event_config->get_amp_trigger_name() ] = $event_config->to_amp_config();
		}
		return $gtag_amp_opt;
	}

	/**
	 * Instantiates and registers the active plugin event lists.
	 *
	 * @since n.e.x.t.
	 */
	private function register_event_lists() {
		/**
		 * Fires when the Advanced_Tracking class is ready to receive event lists.
		 *
		 * This means that Advanced_Tracking class stores the event lists in the Event_List_Registry instance.
		 *
		 * @since n.e.x.t.
		 *
		 * @param Event_List_Registry $event_list_registry
		 */
		do_action( 'googlesitekit_analytics_register_event_lists', $this->event_list_registry );

		foreach ( $this->event_list_registry->get_all() as $registry_event_list ) {
			$registry_event_list->register();
		}
	}

	/**
	 * Compiles the list of Measurement_Event objects.
	 *
	 * @since n.e.x.t.
	 */
	private function compile_events() {
		$this->event_configurations = array();
		foreach ( $this->event_list_registry->get_all() as $registry_event_list ) {
			foreach ( $registry_event_list->get_events() as $measurement_event ) {
				$this->event_configurations[] = $measurement_event;
			}
		}
	}

	/**
	 * Returns list of event configurations.
	 *
	 * @since n.e.x.t.
	 *
	 * @return array The list of event configurations.
	 */
	public function get_event_configurations() {
		return $this->event_configurations;
	}
}
