<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\AMP_Config_Injector
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking;

/**
 * Class for injecting JavaScript based on the registered event configurations.
 *
 * @since 1.18.0.
 * @access private
 * @ignore
 */
final class AMP_Config_Injector {

	/**
	 * Creates list of measurement event configurations and javascript to inject.
	 *
	 * @since 1.18.0.
	 * @since 1.121.0 Migrated from the Analytics (UA) namespace.
	 *
	 * @param array $gtag_amp_opt gtag config options for AMP.
	 * @param array $events       The map of Event objects, keyed by their unique ID.
	 * @return array Filtered $gtag_amp_opt.
	 */
	public function inject_event_configurations( $gtag_amp_opt, $events ) {
		if ( empty( $events ) ) {
			return $gtag_amp_opt;
		}

		if ( ! array_key_exists( 'triggers', $gtag_amp_opt ) ) {
			$gtag_amp_opt['triggers'] = array();
		}

		foreach ( $events as $amp_trigger_key => $event ) {
			$event_config = $event->get_config();

			$amp_trigger = array();
			if ( 'DOMContentLoaded' === $event_config['on'] ) {
				$amp_trigger['on'] = 'visible';
			} else {
				$amp_trigger['on']       = $event_config['on'];
				$amp_trigger['selector'] = $event_config['selector'];
			}

			$amp_trigger['vars']               = array();
			$amp_trigger['vars']['event_name'] = $event_config['action'];
			if ( is_array( $event_config['metadata'] ) ) {
				foreach ( $event_config['metadata'] as $key => $value ) {
					$amp_trigger['vars'][ $key ] = $value;
				}
			}

			$gtag_amp_opt['triggers'][ $amp_trigger_key ] = $amp_trigger;
		}

		return $gtag_amp_opt;
	}
}
