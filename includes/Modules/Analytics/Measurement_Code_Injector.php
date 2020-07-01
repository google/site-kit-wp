<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Measurement_Code_Injector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

/**
 * Injects Javascript based on the current active plugins
 *
 * Class Injector
 */
class Measurement_Code_Injector {
	/**
	 * A list of user's current active plugins that ShirshuClass supports
	 *
	 * @var array of string
	 */
	private $active_plugins = null;

	/**
	 * Holds a list of event configurations to be injected
	 *
	 * @var array
	 */
	private $event_configurations;

	/**
	 * Measurement_Event_Factory instance
	 *
	 * @var Measurement_Event_Factory
	 */
	private $event_factory = null;

	/**
	 * Injector constructor.
	 *
	 * @param array $active_plugins list of supported plugins site currently has activated.
	 */
	public function __construct( $active_plugins ) {
		$this->active_plugins       = $active_plugins;
		$this->event_factory        = Measurement_Event_Factory::get_instance();
		$this->event_configurations = $this->build_event_configurations();
		add_action( 'wp_enqueue_scripts', array( $this, 'inject_event_tracking' ), 1 );
	}

	/**
	 * Sets the event configurations
	 */
	public function build_event_configurations() {
		$event_configurations = array();
		foreach ( $this->active_plugins as $plugin_name ) {
			$measurement_event_list = $this->event_factory->create_measurement_event_list( $plugin_name );
			if ( null !== $measurement_event_list ) {
				foreach ( $measurement_event_list->get_events() as $measurement_event ) {
					array_push( $event_configurations, $measurement_event );
				}
			}
		}
		return $event_configurations;
	}

	/**
	 * Gets the event configurations
	 */
	public function get_event_configurations() {
		return $this->event_configurations;
	}

	/**
	 * Creates list of measurement event configurations and javascript to inject
	 */
	public function inject_event_tracking() {
		$main_file_path = plugin_basename( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$main_dir_path  = strstr( $main_file_path, '/', true );
		wp_enqueue_script( // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			'shirshu_inject_event_tracking',
			'/wp-content/plugins/' . $main_dir_path . '/assets/js/modules/analytics/advanced-tracking/measurement-event-tracking.js',
			false,
			null,
			false
		);
		wp_localize_script(
			'shirshu_inject_event_tracking',
			'eventConfigurations',
			$this->event_configurations
		);
	}
}
