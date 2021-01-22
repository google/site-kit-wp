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
	 * @param array $array          Input associative array to migrate keys for.
	 * @param array $key_mapping    Map of legacy key to current key.
	 * @return array Updated array.
	 */
	protected function migrate_legacy_keys( array $array, array $key_mapping ) {
		foreach ( $key_mapping as $legacy_key => $current_key ) {
			if ( ! isset( $array[ $current_key ] ) && isset( $array[ $legacy_key ] ) ) {
				$array[ $current_key ] = $array[ $legacy_key ];
			}
			unset( $array[ $legacy_key ] );
		}

		return $array;
	}
}
