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

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\CF7_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\FormidableForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\NinjaForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WooCommerce_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WPForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Plugin_Detector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Metadata_Collector;

// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

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
	 * List of active plugin event lists.
	 *
	 * @since n.e.x.t.
	 * @var Measurement_Event_List[]
	 */
	private $plugin_event_lists;

	/**
	 * List of event configurations to be tracked.
	 *
	 * @since n.e.x.t.
	 * @var Measurement_Event[]
	 */
	private $event_configurations;

	/**
	 * Main class plugin detector instance.
	 *
	 * @since n.e.x.t.
	 * @var Plugin_Detector
	 */
	private $plugin_detector;

	/**
	 * Main class code injector instance.
	 *
	 * @var Measurement_Code_Injector
	 */
	private $measurement_code_injector;

	/**
	 * Advanced_Tracking constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Plugin_Detector $plugin_detector Optional plugin detector used for testing. Default is a new instance.
	 */
	public function __construct( $plugin_detector = null ) {
		if ( null === $plugin_detector ) {
			$this->plugin_detector = new Plugin_Detector();
		} else {
			$this->plugin_detector = $plugin_detector;
		}
		$this->measurement_code_injector = null;
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
			15
		);
		add_filter(
			'googlesitekit_amp_gtag_opt',
			function( $gtag_amp_opt ) {
				return $this->set_up_advanced_tracking_amp( $gtag_amp_opt );
			}
		);
		add_action(
			'wp_footer',
			function() {
				if ( null === $this->measurement_code_injector ) {
					return;
				}
				$this->configure_events();
				$this->measurement_code_injector->inject_event_tracking( $this->event_configurations );
			},
			15
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

		$active_plugin_configurations = $this->plugin_detector->determine_active_plugins( $this->get_supported_plugins() );
		$this->register_event_lists( $active_plugin_configurations );

		( new Metadata_Collector( $active_plugin_configurations ) )->register();

		$this->measurement_code_injector = new Measurement_Code_Injector();
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
	 * Instantiates and registers the active plugin event lists.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $active_plugin_configurations The list of active plugin configurations.
	 */
	private function register_event_lists( $active_plugin_configurations ) {
		$this->plugin_event_lists = array();
		foreach ( $active_plugin_configurations as $plugin_config ) {
			$plugin_event_list_class = $plugin_config['event_list_class'];
			$plugin_event_list       = new $plugin_event_list_class();
			$plugin_event_list->register();
			$this->plugin_event_lists[] = $plugin_event_list;
		}
	}

	/**
	 * Builds the list of Measurement_Event objects.
	 *
	 * @since n.e.x.t.
	 */
	private function configure_events() {
		$this->event_configurations = array();
		foreach ( $this->plugin_event_lists as $plugin_event_list ) {
			if ( null !== $plugin_event_list ) {
				foreach ( $plugin_event_list->get_events() as $measurement_event ) {
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
					'check_name'       => 'WPCF7_PLUGIN_DIR',
					'check_type'       => Plugin_Detector::TYPE_CONSTANT,
					'event_list_class' => CF7_Event_List::class,
				),
				'Formidable Forms' => array(
					'check_name'       => 'load_formidable_forms',
					'check_type'       => Plugin_Detector::TYPE_FUNCTION,
					'event_list_class' => FormidableForms_Event_List::class,
				),
				'Ninja Forms'      => array(
					'check_name'       => 'NF_PLUGIN_DIR',
					'check_type'       => Plugin_Detector::TYPE_CONSTANT,
					'event_list_class' => NinjaForms_Event_List::class,
				),
				'WooCommerce'      => array(
					'check_name'       => 'WC_PLUGIN_FILE',
					'check_type'       => Plugin_Detector::TYPE_CONSTANT,
					'event_list_class' => WooCommerce_Event_List::class,
				),
				'WPForms'          => array(
					'check_name'       => 'WPFORMS_PLUGIN_DIR',
					'check_type'       => Plugin_Detector::TYPE_CONSTANT,
					'event_list_class' => WPForms_Event_List::class,
				),
			);
		}
		return $this->supported_plugins;
	}
}
