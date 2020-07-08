<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
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
	 * The javascript code that is injected for event tracking.
	 *
	 * @since n.e.x.t.
	 * @var string
	 */
	private static $inject_script = <<<INJECT_SCRIPT
let config;
for ( config of eventConfigurations ) {
	const thisConfig = config;
	document.addEventListener( config.on, function( e ) {
		if ( e.target.matches( thisConfig.selector ) ) {
			alert( 'Got an event called: '.concat( thisConfig.action ) );
			//record event with gtag here
		} else if ( e.target.matches( thisConfig.selector.concat( ' *' ) ) ) {
			alert( 'Got an event called: '.concat( thisConfig.action ) );
			//record event with gtag here
		}
	}, true );
}
INJECT_SCRIPT;

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
		wp_add_inline_script( 'google_gtagjs', self::$inject_script );

		wp_localize_script(
			'google_gtagjs',
			'eventConfigurations',
			$this->event_configurations
		);
	}
}
