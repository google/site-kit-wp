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
use Google\Site_Kit\Core\Storage\Setting;

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
			function ( $option, $settings ) {
				if ( ! current_user_can( Permissions::MANAGE_OPTIONS ) ) {
					return;
				}

				if ( ! is_array( $settings ) || ! $this instanceof Setting ) {
					return;
				}

				$defaults = $this->get_default();
				if ( ! is_array( $defaults ) ) {
					return;
				}

				if ( $this->have_owned_settings_changed( $settings, $defaults ) ) {
					$this->merge_initial_owner_id();
				}
			},
			10,
			2
		);

		add_filter(
			'pre_update_option_' . static::OPTION,
			function ( $settings, $old_settings ) {
				if (
					current_user_can( Permissions::MANAGE_OPTIONS ) &&
					is_array( $settings ) &&
					is_array( $old_settings ) &&
					$this->have_owned_settings_changed( $settings, $old_settings )
				) {
					return $this->update_owner_id_in_settings( $settings );
				}

				return $settings;
			},
			10,
			2
		);
	}

	/**
	 * Merges the current user ID into the module settings as the initial owner ID.
	 *
	 * @since 1.99.0
	 */
	protected function merge_initial_owner_id() {
		$this->merge( array( 'ownerID' => get_current_user_id() ) );
	}

	/**
	 * Adds the current user ID as the module owner ID to the current module settings.
	 *
	 * @since 1.99.0
	 *
	 * @param array $settings The new module settings.
	 * @return array Updated module settings with the current user ID as the ownerID setting.
	 */
	protected function update_owner_id_in_settings( $settings ) {
		$settings['ownerID'] = get_current_user_id();
		return $settings;
	}

	/**
	 * Determines whether the owned settings have changed.
	 *
	 * @since 1.99.0
	 *
	 * @param array $settings     The new settings.
	 * @param array $old_settings The old settings.
	 * @return bool TRUE if owned settings have changed, otherwise FALSE.
	 */
	protected function have_owned_settings_changed( $settings, $old_settings ) {
		$keys = $this->get_owned_keys();

		foreach ( $keys as $key ) {
			if ( isset( $settings[ $key ], $old_settings[ $key ] ) && $settings[ $key ] !== $old_settings[ $key ] ) {
				return true;
			}
		}

		return false;
	}

}
