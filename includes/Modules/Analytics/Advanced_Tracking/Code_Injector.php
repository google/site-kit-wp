<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Code_Injector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

/**
 * Class for injecting JavaScript based on the registered event configurations.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Code_Injector {

	/**
	 * Creates list of measurement event configurations and javascript to inject.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Event[] $event_configurations The list of Event objects.
	 */
	public function inject_event_tracking( $event_configurations ) {
		if ( empty( $event_configurations ) ) {
			return;
		}

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

				function sendEvent( action, metadata ) {
					if ( null === metadata ) {
						gtag( 'event', action );
					} else {
						gtag( 'event', action, metadata );
					}
				}

				var eventConfigurations = <?php echo wp_json_encode( $event_configurations ); ?>;
				var config;
				for ( config of eventConfigurations ) {
					const thisConfig = config;
					document.addEventListener( config.on, function( e ) {
						if ( "DOMContentLoaded" === thisConfig.on ) {
							sendEvent( thisConfig.action, thisConfig.metadata );
						} else {
							var el = e.target;
							if ( matches( el, thisConfig.selector ) || matches( el, thisConfig.selector.concat( ' *' ) ) ) {
								sendEvent( thisConfig.action, thisConfig.metadata );
							}
						}
					}, true );
				}
			} )();
		</script>
		<?php
	}
}
