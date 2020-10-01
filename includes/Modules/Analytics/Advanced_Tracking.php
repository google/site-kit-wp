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

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Script_Injector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\AMP_Config_Injector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Event_List_Registry;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Event;

/**
 * Class for Google Analytics Advanced Event Tracking.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Advanced_Tracking {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t.
	 * @var Context
	 */
	protected $context;

	/**
	 * List of events to be tracked.
	 *
	 * @since n.e.x.t.
	 * @var Event[]
	 */
	private $events;

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
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context             = $context;
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
	 * Returns the list of events.
	 *
	 * @since n.e.x.t.
	 *
	 * @return Event[] The list of Event objects.
	 */
	public function get_events() {
		return $this->events;
	}

	/**
	 * Injects javascript to track active events.
	 *
	 * @since n.e.x.t.
	 */
	private function set_up_advanced_tracking() {
		$this->compile_events();
		( new Script_Injector() )->inject_event_script( $this->events );
	}

	/**
	 * Adds triggers to AMP configuration.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $gtag_amp_opt gtag config options for AMP.
	 * @return array Filtered $gtag_amp_opt.
	 */
	private function set_up_advanced_tracking_amp( $gtag_amp_opt ) {
		$this->compile_events();
		return ( new AMP_Config_Injector() )->inject_event_configurations( $gtag_amp_opt, $this->events );
	}

	/**
	 * Instantiates and registers event lists.
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

		foreach ( $this->event_list_registry->get_all() as $event_list ) {
			$event_list->register();
		}
	}

	/**
	 * Compiles the list of Event objects.
	 *
	 * @since n.e.x.t.
	 */
	private function compile_events() {
		$this->events = array();
		foreach ( $this->event_list_registry->get_all() as $event_list ) {
			foreach ( $event_list->get_events() as $event ) {
				$this->events[] = $event;
			}
		}
	}
}
