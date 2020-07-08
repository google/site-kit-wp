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
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Event_Factory;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;

// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

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
	 * Advanced_Tracking constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$this->supported_plugins = array(
			array(
				'name'       => 'Contact Form 7',
				'check_name' => 'WPCF7_PLUGIN_DIR',
				'check_type' => Plugin_Detector::$TYPE_CONSTANT,
			),
			array(
				'name'       => 'Formidable Forms',
				'check_name' => 'load_formidable_forms',
				'check_type' => Plugin_Detector::$TYPE_FUNCTION,
			),
			array(
				'name'       => 'Ninja Forms',
				'check_name' => 'NF_PLUGIN_DIR',
				'check_type' => Plugin_Detector::$TYPE_CONSTANT,
			),
			array(
				'name'       => 'WooCommerce',
				'check_name' => 'WC_PLUGIN_FILE',
				'check_type' => Plugin_Detector::$TYPE_CONSTANT,
			),
			array(
				'name'       => 'WPForms',
				'check_name' => 'WPFORMS_PLUGIN_DIR',
				'check_type' => Plugin_Detector::$TYPE_CONSTANT,
			),
			array(
				'name'       => 'WPForms Lite',
				'check_name' => 'WPFORMS_PLUGIN_DIR',
				'check_type' => Plugin_Detector::$TYPE_CONSTANT,
			),
		);
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'set_up_advanced_tracking' ), 11 );
	}

	/**
	 * Creates list of event configurations and injects javascript to track those events.
	 *
	 * @since n.e.x.t.
	 */
	public function set_up_advanced_tracking() {
		if ( ! wp_script_is( 'google_gtagjs' ) ) {
			return;
		}

		$active_plugins = ( new Plugin_Detector( $this->supported_plugins ) )->determine_active_plugins();

		$event_factory        = new Measurement_Event_Factory();
		$event_configurations = array();
		foreach ( $active_plugins as $plugin_name ) {
			$measurement_event_list = $event_factory->create_measurement_event_list( $plugin_name );
			if ( null !== $measurement_event_list ) {
				foreach ( $measurement_event_list->get_events() as $measurement_event ) {
					array_push( $event_configurations, $measurement_event );
				}
			}
		}

		( new Measurement_Code_Injector( $event_configurations ) )->inject_event_tracking();
	}

}
