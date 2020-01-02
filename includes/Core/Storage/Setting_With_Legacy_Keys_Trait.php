<?php
/**
 * Trait Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use \Google\Site_Kit\Core\Util\Migrate_Legacy_Keys;

/**
 * Trait for a Setting that has legacy option keys to migrate.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Setting_With_Legacy_Keys_Trait {
	use Migrate_Legacy_Keys;

	/**
	 * Mapping of legacy keys to current key.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	abstract protected function get_legacy_key_map();

	/**
	 * Registers an option filter for the setting to migrate legacy keys.
	 *
	 * @since n.e.x.t
	 */
	protected function add_legacy_key_migration_filters() {
		add_filter(
			'option_' . static::OPTION,
			function ( $option ) {
				if ( is_array( $option ) ) {
					return $this->migrate_legacy_keys( $option, $this->get_legacy_key_map() );
				}
				return $option;
			}
		);
	}
}
