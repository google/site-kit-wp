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
		$this->validate_config_keys( $config );
		$this->validate_config_value_types( $config );

		$this->config = $config;
	}

	/**
	 * Validates configuration keys.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $config The event's configuration.
	 * @throws \Exception Thrown when duplicate keys or invalid keys.
	 */
	private function validate_config_keys( $config ) {
		$valid_keys = array(
			'pluginName' => false,
			'category'   => false,
			'action'     => false,
			'selector'   => false,
			'on'         => false,
		);
		foreach ( $config as $key => $value ) {
			if ( array_key_exists( $key, $valid_keys ) ) {
				if ( $valid_keys[ $key ] ) {
					throw new \Exception( 'Duplicate configuration parameter: ' . $key );
				} else {
					$valid_keys[ $key ] = true;
				}
			} else {
				throw new \Exception( 'Invalid configuration parameter: ' . $key );
			}
		}
	}

	/**
	 * Validates configuration value types.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $config The event's configuration.
	 * @throws \Exception Thrown when configuration value type is invalid.
	 */
	private function validate_config_value_types( $config ) {
		foreach ( $config as $key => $value ) {
			$value_type = gettype( $value );
			if ( 'string' !== $value_type ) {
				throw new \Exception( 'Invalid type [' . $value_type . '] for configuration paramter: ' . $key );
			}
		}
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

}
