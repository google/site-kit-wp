<?php
/**
 * Trait Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Trait for a Setting that has owner ID option key.
 *
 * @since 1.16.0
 * @access private
 * @ignore
 */
trait Setting_With_Owned_Keys_Trait {

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.16.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	abstract public function get_owned_keys();

	/**
	 * Registers hooks to determine an owner ID for a module.
	 *
	 * @since 1.16.0
	 */
	protected function register_owned_keys() {
		add_action(
			'add_option_' . static::OPTION,
			function ( $option, $value ) {
				if ( is_array( $value ) ) {
					$this->maybe_set_owner_id( $value );
				}
			},
			10,
			2
		);

		add_filter(
			'pre_update_option_' . static::OPTION,
			function ( $value, $old_value ) {
				if ( is_array( $value ) && is_array( $old_value ) ) {
					return $this->maybe_update_owner_id_in_settings( $value, $old_value );
				}
			},
			10,
			2
		);
	}

	/**
	 * Updates settings to set the current user as an owner of the module if settings contain owned keys.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings The module settings.
	 */
	protected function maybe_set_owner_id( $settings ) {
		$keys = $this->get_owned_keys();
		if ( count( array_intersect( array_keys( $settings ), $keys ) ) > 0 && current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			$this->merge( array( 'ownerID' => get_current_user_id() ) );
		}
	}

	/**
	 * Updates the current module settings to have the current user as the owner of the module if at least
	 * one of the owned keys have been changed.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings The new module settings.
	 * @param array $old_settings The old module settings.
	 */
	protected function maybe_update_owner_id_in_settings( $settings, $old_settings ) {
		$keys = $this->get_owned_keys();
		foreach ( $keys as $key ) {
			if (
				isset( $settings[ $key ], $old_settings[ $key ] ) &&
				$settings[ $key ] !== $old_settings[ $key ] &&
				current_user_can( Permissions::MANAGE_OPTIONS )
			) {
				$settings['ownerID'] = get_current_user_id();
				break;
			}
		}

		return $settings;
	}

}
