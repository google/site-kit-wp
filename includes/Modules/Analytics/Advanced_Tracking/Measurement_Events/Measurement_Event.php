<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

use \Exception;

/**
 * Class for representing a single tracking event that Advanced_Tracking tracks.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Measurement_Event implements \JsonSerializable {

	/**
	 * The measurement event's configuration.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $config;

	/**
	 * Measurement_Event constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $config The event's configuration.
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
			'pluginName' => false,
			'category'   => false,
			'action'     => false,
			'selector'   => false,
			'on'         => false,
			'metadata'   => false,
		);
		foreach ( $config as $key => $value ) {
			if ( ! array_key_exists( $key, $valid_keys ) ) {
				throw new \Exception( 'Invalid configuration parameter: ' . $key );
			}       
		}
		if ( ! array_key_exists( 'action', $config ) ) {
			$config['action'] = null;
		}
		if ( ! array_key_exists( 'metadata', $config ) || is_string( $config['metadata'] ) ) {
			$config['metadata'] = null;
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
		$amp_config             = array();
		$amp_config['selector'] = $this->config['selector'];
		$amp_config['on']       = $this->config['on'];

		$vars_config                   = array();
		$vars_config['event_name']     = $this->config['action'];
		$vars_config['event_category'] = $this->config['category'];

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
