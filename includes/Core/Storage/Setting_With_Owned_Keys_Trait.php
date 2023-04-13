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
		$call_when_owned_settings_changed = function( $settings, $old_settings, $callback ) {
			if ( ! current_user_can( Permissions::MANAGE_OPTIONS ) ) {
				return;
			}
	
			$keys = $this->get_owned_keys();
			foreach ( $keys as $key ) {
				if ( isset( $settings[ $key ], $old_settings[ $key ] ) && $settings[ $key ] !== $old_settings[ $key ] ) {
					call_user_func( $callback );
					break;
				}
			}
		};

		add_action(
			'add_option_' . static::OPTION,
			function ( $option, $value ) use ( $call_when_owned_settings_changed ) {
				if ( ! is_array( $value ) || ! $this instanceof Setting ) {
					return;
				}

				$defaults = $this->get_default();
				if ( ! is_array( $defaults ) ) {
					return;
				}

				$call_when_owned_settings_changed(
					$value,
					$defaults,
					array( $this, 'merge_initial_owner_id' )
				);
			},
			10,
			2
		);

		add_filter(
			'pre_update_option_' . static::OPTION,
			function ( $value, $old_value ) use ( $call_when_owned_settings_changed ) {
				if ( is_array( $value ) && is_array( $old_value ) ) {
					$call_when_owned_settings_changed(
						$value,
						$old_value,
						function() use ( &$value ) {
							$value = $this->filter_owner_id_for_updated_settings( $value );
						}
					);
				}

				return $value;
			},
			10,
			2
		);
	}

	/**
	 * Merges the current user ID into the module settings as the initial owner ID.
	 *
	 * @since n.e.x.t
	 */
	protected function merge_initial_owner_id() {
		$this->merge( array( 'ownerID' => get_current_user_id() ) );
	}

	/**
	 * Adds the current user ID as the module owner ID to the current module settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings The new module settings.
	 * @return array Updated module settings with the current user ID as the ownerID setting.
	 */
	protected function filter_owner_id_for_updated_settings( $settings ) {
		$settings['ownerID'] = get_current_user_id();
		return $settings;
	}

}
