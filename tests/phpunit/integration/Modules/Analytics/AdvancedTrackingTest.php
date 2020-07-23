<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics\AdvancedTrackingTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics;

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Plugin_Detector;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking;
use Google\Site_Kit\Tests\Modules\MockPluginDetector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event_Pipe;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\CF7_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\FormidableForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\NinjaForms_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Woocommerce_Event_List;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WPForms_Event_List;

/**
 * Class AdvancedTrackingTest
 * @package Google\Site_Kit\Tests\Modules\Analytics
 */
class AdvancedTrackingTest extends TestCase {

	private $supported_plugins;

	private $mock_plugin_detector;

	public function setUp() {
		parent::setUp();

		$this->supported_plugins    = ( new Advanced_Tracking() )->get_supported_plugins();
		$this->mock_plugin_detector = new MockPluginDetector();
	}

	/**
	 * Tests if the sets of events in the active plugins are included in the tracking event configurations.
	 */
	public function test_get_event_configurations() {
		$this->enqueue_google_script();

		$advanced_tracking = new Advanced_Tracking( $this->mock_plugin_detector );

		$num_supported_plugins = count( $this->supported_plugins );
		$num_permutations      = pow( 2, $num_supported_plugins );
		for ( $permutation = 0; $permutation < $num_permutations; $permutation++ ) {
			remove_all_actions( 'wp_enqueue_scripts' );
			$advanced_tracking->register();
			if ( 0 == $permutation ) {
				do_action( 'wp_enqueue_scripts' );
				$this->assertEmpty( $advanced_tracking->get_event_configurations() );
			} else {
				$this->update_plugin_detector( $permutation );

				do_action( 'wp_enqueue_scripts' );
				$actual_event_configurations = $advanced_tracking->get_event_configurations();

				$this->compare_event_configurations( $actual_event_configurations );
			}
		}
	}

	/**
	 * Updates the active plugin array in the MockPluginDetector.
	 *
	 * @param number $permutation represents what permutation of supported plugins to enable.
	 */
	private function update_plugin_detector( $permutation ) {
		foreach ( $this->supported_plugins as $plugin_name => $plugin_configuration ) {
			if ( 1 == ( $permutation % 2 ) ) {
				$this->mock_plugin_detector->add_active_plugin( $plugin_name, $plugin_configuration );
			} else {
				$this->mock_plugin_detector->remove_active_plugin( $plugin_name );
			}
			$permutation = $permutation >> 1;
		}
	}

	/**
	 * Compares returned list of events to expected events.
	 *
	 * @param array $actual_event_configs list of Measurement_Event objects returned by Advanced_Tracking.
	 */
	private function compare_event_configurations( $actual_event_configs ) {
		foreach ( $this->mock_plugin_detector->determine_active_plugins( null ) as $plugin_name => $plugin_config ) {
			$event_list = $plugin_config['event_config_list'];
			foreach ( $event_list->get_events() as $expected_event_config ) {
				$found = false;
				foreach ( $actual_event_configs as $actual_event_config ) {
					if ( json_encode( $expected_event_config ) === json_encode( $actual_event_config ) ) {
						$found = true;
						break;
					}
				}
				$this->assertTrue( $found );
			}
		}
	}

	/**
	 * Enqueue's the google gtag script.
	 */
	private function enqueue_google_script() {
		if ( ! wp_script_is( 'google_gtagjs' ) ) {
			wp_enqueue_script( // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
				'google_gtagjs',
				'https://www.googletagmanager.com/gtag/js',
				false,
				null,
				false
			);
		}

	}
}
