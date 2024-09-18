<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

use Closure;
use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class handling the storage of remote features.
 *
 * @since 1.118.0
 * @since 1.133.0 Changed to extend Setting
 * @access private
 * @ignore
 */
final class Remote_Features extends Setting {
	/**
	 * Option key in options table to store remote features.
	 */
	const OPTION = 'googlesitekitpersistent_remote_features';

	/**
	 * Gets the expected value type.
	 *
	 * @return string
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'last_updated_at' => 0,
		);
	}

	/**
	 * Includes the current timestamp to the setting and updates it.
	 *
	 * @since 1.134.0
	 *
	 * @param array $features features array.
	 */
	public function update( $features ) {
		$features['last_updated_at'] = time();

		return $this->set( $features );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @return Closure
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			if ( ! is_array( $value ) ) {
				return array();
			}

			$new_value = array();

			foreach ( $value as $feature => $meta ) {
				if ( 'last_updated_at' === $feature ) {
					$new_value[ $feature ] = is_int( $meta ) ? $meta : 0;
				} else {
					$new_value[ $feature ] = array( 'enabled' => ! empty( $meta['enabled'] ) );
				}
			}

			return $new_value;
		};
	}
}
