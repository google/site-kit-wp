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
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Interface;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for Analytics 4 settings.
 *
 * @since 1.30.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface, Setting_With_ViewOnly_Keys_Interface {

	use Setting_With_Owned_Keys_Trait;
	use Method_Proxy_Trait;

	const OPTION = 'googlesitekit_analytics-4_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.30.0
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();

		// Since migration of Analytics module settings into Analytics 4 settings,
		// if data was saved previously, it needs to be recovered.
		add_filter(
			'option_' . self::OPTION,
			$this->get_method_proxy( 'retrieve_missing_settings' ),
			10
		);
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
			'accountID',
			'propertyID',
			'webDataStreamID',
			'measurementID',
			'googleTagID',
			'googleTagAccountID',
			'googleTagContainerID',
		);
	}

	/**
	 * Returns keys for view-only settings.
	 *
	 * @since 1.113.0
	 *
	 * @return array An array of keys for view-only settings.
	 */
	public function get_view_only_keys() {
		return array( 'availableCustomDimensions' );
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
			'ownerID'                   => 0,
			'accountID'                 => '',
			'adsConversionID'           => '',
			'adsenseLinked'             => false,
			'propertyID'                => '',
			'webDataStreamID'           => '',
			'measurementID'             => '',
			'trackingDisabled'          => array( 'loggedinUsers' ),
			'useSnippet'                => true,
			'canUseSnippet'             => true,
			'googleTagID'               => '',
			'googleTagAccountID'        => '',
			'googleTagContainerID'      => '',
			'googleTagLastSyncedAtMs'   => 0,
			'availableCustomDimensions' => null,
			'propertyCreateTime'        => 0,
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
				if ( isset( $option['canUseSnippet'] ) ) {
					$option['canUseSnippet'] = (bool) $option['canUseSnippet'];
				}
				if ( isset( $option['googleTagID'] ) ) {
					if ( ! preg_match( '/^(G|GT|AW)-[a-zA-Z0-9]+$/', $option['googleTagID'] ) ) {
						$option['googleTagID'] = '';
					}
				}
				if ( isset( $option['trackingDisabled'] ) ) {
					// Prevent other options from being saved if 'loggedinUsers' is selected.
					if ( in_array( 'loggedinUsers', $option['trackingDisabled'], true ) ) {
						$option['trackingDisabled'] = array( 'loggedinUsers' );
					} else {
						$option['trackingDisabled'] = (array) $option['trackingDisabled'];
					}
				}
				if ( isset( $option['adsenseLinked'] ) ) {
					$option['adsenseLinked'] = (bool) $option['adsenseLinked'];
				}

				$numeric_properties = array( 'googleTagAccountID', 'googleTagContainerID' );
				foreach ( $numeric_properties as $numeric_property ) {
					if ( isset( $option[ $numeric_property ] ) ) {
						if ( ! is_numeric( $option[ $numeric_property ] ) || ! $option[ $numeric_property ] > 0 ) {
							$option[ $numeric_property ] = '';
						}
					}
				}

				if ( isset( $option['availableCustomDimensions'] ) ) {
					if ( is_array( $option['availableCustomDimensions'] ) ) {
						$valid_dimensions = array_filter(
							$option['availableCustomDimensions'],
							function( $dimension ) {
								return is_string( $dimension ) && strpos( $dimension, 'googlesitekit_' ) === 0;
							}
						);

						$option['availableCustomDimensions'] = array_values( $valid_dimensions );
					} else {
						$option['availableCustomDimensions'] = null;
					}
				}
			}

			return $option;
		};
	}

	/**
	 * Sync settings migrated from `Analytics` module if they are not
	 * present in `Analytics_4` settings.
	 *
	 * This ensures backward compatibility for the users who had Site Kit installed
	 * before migrating to the singular Analytics module. As some settings were defined
	 * in old `Analtyics` module and re-used here.
	 *
	 * @since 1.118.0
	 *
	 * @param array $option Analytics 4 settings.
	 * @return array Missing Analytics 4 settings array, or empty array if no setting is missing.
	 */
	protected function retrieve_missing_settings( $option ) {
		if ( ! is_array( $option ) ) {
			return $option;
		}

		$recovered_settings = array();
		$keys_to_check      = array(
			'accountID',
			'adsConversionID',
			'adsenseLinked',
			'canUseSnippet',
			'trackingDisabled',
		);
		$missing_settings   = array_diff( $keys_to_check, array_keys( $option ) );

		if ( empty( $missing_settings ) ) {
			return $option;
		}

		$analytics_settings = get_option( 'googlesitekit_analytics_settings' );

		array_walk(
			$missing_settings,
			function( $setting ) use ( &$recovered_settings, $analytics_settings ) {
				$recovered_settings[ $setting ] = $analytics_settings[ $setting ];
			}
		);

		if ( ! empty( $recovered_settings ) ) {
			return $option + $recovered_settings;
		}

		return $option;
	}

}
