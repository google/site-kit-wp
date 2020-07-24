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

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Event_List_Factory;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;

// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

/**
 * Class for Advanced Tracking.
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
	 * @var array
	 */
	private $event_configurations;

	/**
	 * Main class plugin factory instance.
	 *
	 * @since n.e.x.t.
	 * @var Measurement_Event_List_Factory
	 */
	private $event_list_factory;

	/**
	 * Advanced_Tracking constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Measurement_Event_List_Factory $event_list_factory Optional event list factory used for testing. Default is a new instance.
	 */
	public function __construct( $event_list_factory = null ) {
		if ( null === $event_list_factory ) {
			$this->event_list_factory = new Measurement_Event_List_Factory();
		} else {
			$this->event_list_factory = $event_list_factory;
		}
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_action(
			'wp_enqueue_scripts',
			function() {
				$this->set_up_advanced_tracking();
			},
			11
		);
		add_filter(
			'googlesitekit_amp_gtag_opt',
			function( $gtag_amp_opt ) {
				return $this->set_up_advanced_tracking_amp( $gtag_amp_opt );
			}
		);
	}

	/**
	 * Injects javascript to track active events.
	 *
	 * @since n.e.x.t.
	 */
	private function set_up_advanced_tracking() {
		if ( ! wp_script_is( 'google_gtagjs' ) ) {
			return;
		}
		$this->configure_events();
		// TODO: Instantiate and register Metadata_Collector here.
		( new Measurement_Code_Injector( $this->event_configurations ) )->inject_event_tracking();
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
		$this->configure_events();

		if ( ! array_key_exists( 'triggers', $gtag_amp_opt ) ) {
			$gtag_amp_opt['triggers'] = array();
		}
		foreach ( $this->event_configurations as $event_config ) {
			$gtag_amp_opt['triggers'][ $event_config->get_amp_trigger_name() ] = $event_config->to_amp_config();
		}
		return $gtag_amp_opt;
	}

	/**
	 * Creates list of event configurations.
	 *
	 * @since n.e.x.t.
	 */
	private function configure_events() {
		$active_plugin_event_lists = $this->event_list_factory->get_active_plugin_event_lists( $this->get_supported_plugins() );

		$this->event_configurations = array();
		foreach ( $active_plugin_event_lists as $event_list ) {
			if ( null !== $event_list ) {
				foreach ( $event_list->get_events() as $measurement_event ) {
					$this->event_configurations[] = $measurement_event;
				}
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


	/**
	 * Returns list of supported plugins.
	 *
	 * @since n.e.x.t.
	 *
	 * @return array The list of supported plugins.
	 */
	public function get_supported_plugins() {
		if ( null == $this->supported_plugins ) {
			$this->supported_plugins = array(
				'Contact Form 7'   => array(
					'check_name' => 'WPCF7_PLUGIN_DIR',
					'check_type' => Measurement_Event_List_Factory::TYPE_CONSTANT,
				),
				'Formidable Forms' => array(
					'check_name' => 'load_formidable_forms',
					'check_type' => Measurement_Event_List_Factory::TYPE_FUNCTION,
				),
				'Ninja Forms'      => array(
					'check_name' => 'NF_PLUGIN_DIR',
					'check_type' => Measurement_Event_List_Factory::TYPE_CONSTANT,
				),
				'WooCommerce'      => array(
					'check_name' => 'WC_PLUGIN_FILE',
					'check_type' => Measurement_Event_List_Factory::TYPE_CONSTANT,
				),
				'WPForms'          => array(
					'check_name' => 'WPFORMS_PLUGIN_DIR',
					'check_type' => Measurement_Event_List_Factory::TYPE_CONSTANT,
				),
			);
		}
		return $this->supported_plugins;
	}
}
