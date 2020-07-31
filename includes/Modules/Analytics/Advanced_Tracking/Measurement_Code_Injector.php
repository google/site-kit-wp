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

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event;

/**
 * Class for injecting Javascript based on the current active plugins.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Measurement_Code_Injector {

	/**
	 * Creates list of measurement event configurations and javascript to inject.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Measurement_Event[] $event_configurations The list of Measurement_Event objects.
	 */
	public function inject_event_tracking( $event_configurations ) {
		?>
		<script>
			( function() {
				function matches( el, selector ) {
					const matcher =
						el.matches ||
						el.webkitMatchesSelector ||
						el.mozMatchesSelector ||
						el.msMatchesSelector ||
						el.oMatchesSelector;
					if ( matcher ) {
						return matcher.call( el, selector );
					}
					return false;
				}
				var eventConfigurations = <?php echo wp_json_encode( $event_configurations ); ?>;
				var config;
				for ( config of eventConfigurations ) {
					console.log(config);
					const thisConfig = config;
					document.addEventListener( config.on, function( e ) {
						if ( "DOMContentLoaded" === thisConfig.on ) {
							alert('got an event called: '.concat(thisConfig.action));
							gtag( 'event', thisConfig.action, thisConfig.metadata );
						} else {
							var el = e.target;
							if ( matches( el, thisConfig.selector ) || matches( el, thisConfig.selector.concat( ' *' ) ) ) {
								gtag( 'event', thisConfig.action, thisConfig.metadata );
							}
						}
					}, true );
				}
			} )();
		</script>
		<?php
	}
}
