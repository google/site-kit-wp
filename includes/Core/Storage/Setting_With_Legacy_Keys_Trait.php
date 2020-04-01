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
 * @since 1.2.0
 * @access private
 * @ignore
 */
trait Setting_With_Legacy_Keys_Trait {
	use Migrate_Legacy_Keys;

	/**
	 * Registers an option filter for the setting to migrate legacy keys.
	 *
	 * @param array $legacy_key_map Mapping of legacy keys to current key.
	 *
	 * @since 1.2.0
	 */
	protected function register_legacy_keys_migration( array $legacy_key_map ) {
		add_filter(
			'option_' . static::OPTION,
			function ( $option ) use ( $legacy_key_map ) {
				if ( is_array( $option ) ) {
					return $this->migrate_legacy_keys( $option, $legacy_key_map );
				}
				return $option;
			},
			0
		);
	}
}
