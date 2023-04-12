<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;

/**
 * Class for Analytics 4 settings.
 *
 * @since 1.30.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {

	use Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_analytics-4_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.30.0
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();
	}

	/**
	 * Gets Analytics 4 settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Analytics 4 settings, or default if not set.
	 */
	public function get() {
		$value = parent::get();
		$value = is_array( $value ) ? $value : $this->get_default();

		// This is a temporary solution to keep using the Analytics ownerID setting
		// as the main source of truth for the Analytics 4 ownerID value.
		//
		// This is needed because currently the Analytics 4 functionality is separated
		// from the Analytics module and we need to keep the ownerID synced between two
		// modules. We will remove this hack when UA is sunset and only both modules
		// are merged.
		$analytics_settings = ( new Analytics_Settings( $this->options ) )->get();
		$value['ownerID'] = $analytics_settings['ownerID'];

		return $value;
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.30.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			// TODO: These can be uncommented when Analytics and Analytics 4 modules are officially separated.
			/* 'accountID', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			/* 'adsConversionID', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			'propertyID',
			'webDataStreamID',
			'measurementID',
			'googleTagID',
			'googleTagAccountID',
			'googleTagContainerID',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.30.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'                 => 0,
			// TODO: These can be uncommented when Analytics and Analytics 4 modules are officially separated.
			/* 'accountID'       		=> '', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			/* 'adsConversionID' 		=> '', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			'propertyID'              => '',
			'webDataStreamID'         => '',
			'measurementID'           => '',
			'useSnippet'              => true,
			'googleTagID'             => '',
			'googleTagAccountID'      => '',
			'googleTagContainerID'    => '',
			'googleTagLastSyncedAtMs' => 0,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.30.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function( $option ) {
			if ( is_array( $option ) ) {
				if ( isset( $option['useSnippet'] ) ) {
					$option['useSnippet'] = (bool) $option['useSnippet'];
				}

				if ( isset( $option['googleTagID'] ) ) {
					if ( ! preg_match( '/^(G|GT|AW)-[a-zA-Z0-9]+$/', $option['googleTagID'] ) ) {
						$option['googleTagID'] = '';
					}
				}

				$numeric_properties = array( 'googleTagAccountID', 'googleTagContainerID' );
				foreach ( $numeric_properties as $numeric_property ) {
					if ( isset( $option[ $numeric_property ] ) ) {
						if ( ! is_numeric( $option[ $numeric_property ] ) || ! $option[ $numeric_property ] > 0 ) {
							$option[ $numeric_property ] = '';
						}
					}
				}
			}

			return $option;
		};
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
			$user_id = get_current_user_id();
			$this->merge( array( 'ownerID' => $user_id ) );

			// This is a temporary solution to sync owner IDs between Analytics and Analytics 4 modules.
			// The owner ID setting of the Analytics module is the source of truth for the Analytics 4 module.
			// This will change when Analytics is sunset and we merge both modules into one.
			( new Analytics_Settings( $this->options ) )->merge( array( 'ownerID' => $user_id ) );
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
	protected function maybe_update_owner_id_in_settings_before_saving_them( $settings, $old_settings ) {
		$keys = $this->get_owned_keys();
		foreach ( $keys as $key ) {
			if (
				isset( $settings[ $key ], $old_settings[ $key ] ) &&
				$settings[ $key ] !== $old_settings[ $key ] &&
				current_user_can( Permissions::MANAGE_OPTIONS )
			) {
				$settings['ownerID'] = get_current_user_id();

				// This is a temporary solution to sync owner IDs between Analytics and Analytics 4 modules.
				// The owner ID setting of the Analytics module is the source of truth for the Analytics 4 module.
				// This will change when Analytics is sunset and we merge both modules into one.
				( new Analytics_Settings( $this->options ) )->merge( array( 'ownerID' => $settings['ownerID'] ) );

				break;
			}
		}

		return $settings;
	}

}
