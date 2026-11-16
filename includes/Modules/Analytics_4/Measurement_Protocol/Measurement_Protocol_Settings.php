<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for the stored Measurement Protocol secret value, with its secret ID and the property and web data stream it belongs to.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Measurement_Protocol_Settings extends Setting {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_analytics-4_measurement_protocol';

	/**
	 * Gets the stored secret.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Secret value with its property ID, web data stream ID and secret ID.
	 */
	public function get() {
		$option = parent::get();

		if ( ! $this->is_valid_value( $option ) ) {
			return $this->get_default();
		}

		return $option;
	}

	/**
	 * Stores the secret.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $value Secret value with its property ID, web data stream ID and secret ID.
	 * @return bool True on success, false on failure.
	 */
	public function set( $value ) {
		if ( ! $this->is_valid_value( $value ) ) {
			return false;
		}

		return parent::set( $value );
	}

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
	 * @return array Default value with every key set to an empty string.
	 */
	protected function get_default() {
		return array(
			'secretValue'     => '',
			'propertyID'      => '',
			'webDataStreamID' => '',
			'secretID'        => '',
		);
	}

	/**
	 * Determines whether the given value is an array with a string for each key of the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Value to check.
	 * @return bool True if the value is valid, otherwise false.
	 */
	private function is_valid_value( $value ) {
		foreach ( array_keys( $this->get_default() ) as $key ) {
			if ( ! is_string( $value[ $key ] ?? null ) ) {
				return false;
			}
		}

		return true;
	}
}
