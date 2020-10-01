<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Event
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

use \Exception;

/**
 * Class for representing a single tracking event that Advanced_Tracking tracks.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Event implements \JsonSerializable {

	/**
	 * The measurement event's configuration.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $config;

	/**
	 * Event constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $config {
	 *     The event's configuration.
	 *
	 *     @type string     $action   Required. The event action / event name to send.
	 *     @type string     $on       Required. The DOM event to send the event for.
	 *     @type string     $selector Required, unless $on is 'DOMContentLoaded'. The DOM selector on which to listen
	 *                                to the $on event.
	 *     @type array|null $metadata Optional. Associative array of event metadata to send, such as 'event_category',
	 *                                'event_label' etc, or null to not send any extra event data.
	 * }
	 * @throws \Exception Thrown when config param is undefined.
	 */
	public function __construct( $config ) {
		$this->config = $this->validate_config( $config );
	}

	/**
	 * Validates the configuration keys and value types.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $config The event's configuration.
	 * @return array The event's configuration.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function validate_config( $config ) {
		$valid_keys = array(
			'action',
			'selector',
			'on',
			'metadata',
		);
		foreach ( $config as $key => $value ) {
			if ( ! in_array( $key, $valid_keys, true ) ) {
				throw new \Exception( 'Invalid configuration parameter: ' . $key );
			}
		}
		if ( ! array_key_exists( 'metadata', $config ) ) {
			$config['metadata'] = null;
		}
		if ( array_key_exists( 'on', $config ) && 'DOMContentLoaded' === $config['on'] ) {
			$config['selector'] = '';
		}
		foreach ( $valid_keys as $key ) {
			if ( ! array_key_exists( $key, $config ) ) {
				throw new \Exception( 'Missed configuration parameter: ' . $key );
			}
		}
		return $config;
	}

	/**
	 * Returns event configuration selector as AMP trigger name.
	 *
	 * @since n.e.x.t.
	 *
	 * @return string The event selector.
	 */
	public function get_amp_trigger_name() {
		return $this->config['selector'];
	}

	/**
	 * Converts the event configuration to an AMP configuration.
	 *
	 * @since n.e.x.t.
	 *
	 * @return array $amp_config The AMP configuration for this event.
	 */
	public function to_amp_config() {
		$amp_config = array();
		if ( 'DOMContentLoaded' === $this->config['on'] ) {
			$amp_config['on'] = 'visible';
		} else {
			$amp_config['on']       = $this->config['on'];
			$amp_config['selector'] = $this->config['selector'];
		}

		$vars_config               = array();
		$vars_config['event_name'] = $this->config['action'];
		if ( is_array( $this->config['metadata'] ) ) {
			foreach ( $this->config['metadata'] as $key => $value ) {
				$vars_config[ $key ] = $value;
			}
		}
		$amp_config['vars'] = $vars_config;

		return $amp_config;
	}

	/**
	 * Returns an associative event containing the event attributes.
	 *
	 * @since n.e.x.t.
	 *
	 * @return array The configuration in JSON-serializable format.
	 */
	public function jsonSerialize() {
		return $this->config;
	}

	/**
	 * Returns the Measurment_Event configuration.
	 *
	 * @since n.e.x.t.
	 *
	 * @return array The config.
	 */
	public function get_config() {
		return $this->config;
	}
}
