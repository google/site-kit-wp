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

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Plugin_Detector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Woocommerce_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WPForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\CF7_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\FormidableForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\NinjaForms_Event_List;

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
	 * List of plugins SiteKit supports for event tracking.
	 *
	 * @since n.e.x.t.
	 * @var array of strings
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
	 * Main class plugin detector instance.
	 *
	 * @since n.e.x.t.
	 * @var Plugin_Detector
	 */
	private $plugin_detector;

	/**
	 * Advanced_Tracking constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Plugin_Detector $mock_plugin_detector optional plugin detector used for testing.
	 */
	public function __construct( $mock_plugin_detector = null ) {
		$this->supported_plugins = array(
			'Contact Form 7'   => array(
				'check_name'        => 'WPCF7_PLUGIN_DIR',
				'check_type'        => Plugin_Detector::TYPE_CONSTANT,
				'event_config_list' => new CF7_Event_List(),
			),
			'Formidable Forms' => array(
				'check_name'        => 'load_formidable_forms',
				'check_type'        => Plugin_Detector::TYPE_FUNCTION,
				'event_config_list' => new FormidableForms_Event_List(),
			),
			'Ninja Forms'      => array(
				'check_name'        => 'NF_PLUGIN_DIR',
				'check_type'        => Plugin_Detector::TYPE_CONSTANT,
				'event_config_list' => new NinjaForms_Event_List(),
			),
			'WooCommerce'      => array(
				'check_name'        => 'WC_PLUGIN_FILE',
				'check_type'        => Plugin_Detector::TYPE_CONSTANT,
				'event_config_list' => new Woocommerce_Event_List(),
			),
			'WPForms'          => array(
				'check_name'        => 'WPFORMS_PLUGIN_DIR',
				'check_type'        => Plugin_Detector::TYPE_CONSTANT,
				'event_config_list' => new WPForms_Event_List(),
			),
		);
		if ( null === $mock_plugin_detector ) {
			$this->plugin_detector = new Plugin_Detector( $this->supported_plugins );
		} else {
			$this->plugin_detector = $mock_plugin_detector;
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
	}

	/**
	 * Creates list of event configurations and injects javascript to track those events.
	 *
	 * @since n.e.x.t.
	 */
	private function set_up_advanced_tracking() {
		if ( ! wp_script_is( 'google_gtagjs' ) ) {
			return;
		}

		$active_plugins = $this->plugin_detector->determine_active_plugins();

		$this->event_configurations = array();
		foreach ( $active_plugins as $plugin_config ) {
			$measurement_event_list = $plugin_config['event_config_list'];
			if ( null !== $measurement_event_list ) {
				foreach ( $measurement_event_list->get_events() as $measurement_event ) {
					$this->event_configurations[] = $measurement_event;
				}
			}
		}
		( new Measurement_Code_Injector( $this->event_configurations ) )->inject_event_tracking();
	}

	/**
	 * Returns list of event configurations.
	 *
	 * @return array The list of event configurations.
	 */
	public function get_event_configurations() {
		return $this->event_configurations;
	}
}
