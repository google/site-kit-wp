<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

/**
 * Injects Javascript based on the current active plugins
 *
 * Class Injector
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Measurement_Code_Injector {

	/**
	 * Holds a list of event configurations to be injected
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $event_configurations;

	/**
	 * Injector constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $event_configurations list of measurement events to track.
	 */
	public function __construct( $event_configurations ) {
		$this->event_configurations = $event_configurations;
	}

	/**
	 * Creates list of measurement event configurations and javascript to inject.
	 *
	 * @since n.e.x.t.
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
