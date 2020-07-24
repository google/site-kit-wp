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

use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking;
use Google\Site_Kit\Tests\Modules\MockMeasurementEventListFactory;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event_Pipe;

/**
 * Class AdvancedTrackingTest
 * @package Google\Site_Kit\Tests\Modules\Analytics
 */
class AdvancedTrackingTest extends TestCase {

	private $supported_plugins;

	private $mock_event_list_factory;

	public function setUp() {
		parent::setUp();

		$this->supported_plugins    = ( new Advanced_Tracking() )->get_supported_plugins();
		$this->mock_event_list_factory = new MockMeasurementEventListFactory();
	}

	/**
	 * Tests if the sets of events in the active plugins are included in the tracking event configurations.
	 */
	public function test_configure_events() {
		$this->enqueue_google_script();

		$advanced_tracking = new Advanced_Tracking( $this->mock_event_list_factory );

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
	 * Updates the active plugin array in the MockMeasurementEventListFactory.
	 *
	 * @param number $permutation represents what permutation of supported plugins to enable.
	 */
	private function update_plugin_detector( $permutation ) {
		$supported_plugin_names = array_keys( $this->supported_plugins );
		foreach ( $supported_plugin_names as $plugin_name ) {
			if ( 1 == ( $permutation % 2 ) ) {
				$this->mock_event_list_factory->add_active_plugin( $plugin_name );
			} else {
				$this->mock_event_list_factory->remove_active_plugin( $plugin_name );
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
		foreach ( $this->mock_event_list_factory->get_active_plugin_event_lists( null ) as $event_list ) {
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
	 * Tests if the expected Javascript code is printed for a given sets of events.
	 */
	public function test_inject_event_tracking() {
		$advanced_tracking    = new Advanced_Tracking( $this->mock_event_list_factory );
		$event_configurations = Measurement_Event_Pipe::encode_measurement_event_list( $advanced_tracking->get_event_configurations() );

		$expected_script = <<<INJECT_SCRIPT
( function() {
    var eventConfigurations = {$event_configurations};
	var config;
	for ( config of eventConfigurations ) {
		const thisConfig = config;
		document.addEventListener( config.on, function( e ) {
			var el = e.target;
			var matcher = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector;
			if ( matcher && ( matcher.call( el, thisConfig.selector ) || matcher.call( el, thisConfig.selector.concat( ' *' ) ) ) ) {
				alert( 'Got an event called: '.concat( thisConfig.action ) );

				var params = {};
				if ( "metadata" in thisConfig && null !== thisConfig.metadata ) {
					params = thisConfig.metadata( params, el );
				}
				params['event_category'] = thisConfig.category;
				console.log(params);

				gtag( 'event', thisConfig.action, params);
			}
		}, true );
	}
	}
)();
INJECT_SCRIPT;

		$measurement_code_injector = new Measurement_Code_Injector( $advanced_tracking->get_event_configurations() );
		$this->assertSame( $expected_script, $measurement_code_injector->get_injected_script() );
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
