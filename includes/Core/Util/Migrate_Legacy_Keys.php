<?php
/**
 * Trait Google\Site_Kit\Core\Util\Migrate_Legacy_Keys
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Trait for a class that migrates array keys from old to new.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
trait Migrate_Legacy_Keys {

	/**
	 * Migrates legacy array keys to the current key.
	 *
	 * @since 1.2.0
	 *
	 * @param array $legacy_array          Input associative array to migrate keys for.
	 * @param array $key_mapping    Map of legacy key to current key.
	 * @return array Updated array.
	 */
	protected function migrate_legacy_keys( array $legacy_array, array $key_mapping ) {
		foreach ( $key_mapping as $legacy_key => $current_key ) {
			if ( ! isset( $legacy_array[ $current_key ] ) && isset( $legacy_array[ $legacy_key ] ) ) {
				$legacy_array[ $current_key ] = $legacy_array[ $legacy_key ];
			}
			unset( $legacy_array[ $legacy_key ] );
		}

		return $legacy_array;
	}
}
