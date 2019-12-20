<?php
/**
 * Trait Google\Site_Kit\Core\Util\Migrate_Legacy_Keys
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Trait for a class that migrates array keys from old to new.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Migrate_Legacy_Keys {

	/**
	 * Mapping of legacy keys to current key.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $legacy_key_map = array();

	/**
	 * Migrates legacy option keys to the current key.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $array Input associative array to migrate keys for.
	 * @return array Updated array.
	 */
	protected function migrate_legacy_keys( array $array ) {
		foreach ( $this->legacy_key_map as $legacy_key => $current_key ) {
			if ( ! isset( $array[ $current_key ] ) && isset( $array[ $legacy_key ] ) ) {
				$array[ $current_key ] = $array[ $legacy_key ];
			}
			unset( $array[ $legacy_key ] );
		}

		return $array;
	}
}
