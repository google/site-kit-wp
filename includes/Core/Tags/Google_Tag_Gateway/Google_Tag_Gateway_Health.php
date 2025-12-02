<?php
/**
 * Class Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Health
 *
 * @package   Google\Site_Kit\Core\Tags\Google_Tag_Gateway
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class to store Google Tag Gateway health monitoring data.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Google_Tag_Gateway_Health extends Setting {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_google_tag_gateway_health';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isUpstreamHealthy' => null,
			'isMpathHealthy'    => null,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['isUpstreamHealthy'] ) ) {
				$new_value['isUpstreamHealthy'] = (bool) $value['isUpstreamHealthy'];
			}

			if ( isset( $value['isMpathHealthy'] ) ) {
				$new_value['isMpathHealthy'] = (bool) $value['isMpathHealthy'];
			}

			return $new_value;
		};
	}

	/**
	 * Merges an array of health monitoring data to update.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $partial Partial health data array to save.
	 * @return bool True on success, false on failure.
	 */
	public function merge( array $partial ) {
		$health_data = $this->get();
		$partial     = array_filter(
			$partial,
			function ( $value ) {
				return null !== $value;
			}
		);

		$allowed_health_data = array(
			'isUpstreamHealthy' => true,
			'isMpathHealthy'    => true,
		);

		$updated = array_intersect_key( $partial, $allowed_health_data );

		return $this->set( array_merge( $health_data, $updated ) );
	}

	/**
	 * Checks if Google Tag Gateway is healthy.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if GTG is healthy, false otherwise.
	 */
	public function is_healthy() {
		$health_data = $this->get();

		return isset( $health_data['isUpstreamHealthy'] ) &&
				true === $health_data['isUpstreamHealthy'] &&
				isset( $health_data['isMpathHealthy'] ) &&
				true === $health_data['isMpathHealthy'];
	}
}
