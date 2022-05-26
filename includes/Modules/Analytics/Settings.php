<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;

/**
 * Class for Analytics settings.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Legacy_Keys_Trait, Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_analytics_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.2.0
	 */
	public function register() {
		parent::register();

		$this->register_legacy_keys_migration(
			array(
				'accountId'             => 'accountID',
				'profileId'             => 'profileID',
				'propertyId'            => 'propertyID',
				'internalWebPropertyId' => 'internalWebPropertyID',
			)
		);

		$this->register_owned_keys();

		// Backwards compatibility with previous dedicated option.
		add_filter(
			'default_option_' . self::OPTION,
			function ( $default ) {
				// Only fallback to the legacy option if the linked state is not filtered.
				// This filter is documented below.
				if ( is_null( apply_filters( 'googlesitekit_analytics_adsense_linked', null ) ) ) {
					$default['adsenseLinked'] = (bool) $this->options->get( 'googlesitekit_analytics_adsense_linked' );
				}

				// `canUseSnippet` is a computed setting, so this sets the value if settings have not been saved yet.
				// This filter is documented below.
				$can_use_snippet = apply_filters( 'googlesitekit_analytics_can_use_snippet', true, '' );
				if ( is_bool( $can_use_snippet ) ) {
					$default['canUseSnippet'] = $can_use_snippet;
				}

				return $default;
			}
		);

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
				/**
				 * Filters the Google Analytics account ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $account_id Empty by default, will fall back to the option value if not set.
				 */
				$account_id = apply_filters( 'googlesitekit_analytics_account_id', '' );
				if ( ! empty( $account_id ) ) {
					$option['accountID'] = $account_id;
				}

				/**
				 * Filters the Google Analytics property ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $property_id Empty by default, will fall back to the option value if not set.
				 */
				$property_id = apply_filters( 'googlesitekit_analytics_property_id', '' );
				if ( ! empty( $property_id ) ) {
					$option['propertyID'] = $property_id;
				}
				$property_id = isset( $option['propertyID'] ) ? $option['propertyID'] : '';

				/**
				 * Filters the Google Analytics internal web property ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $internal_web_property_id Empty by default, will fall back to the option value if not set.
				 */
				$internal_web_property_id = apply_filters( 'googlesitekit_analytics_internal_web_property_id', '' );
				if ( ! empty( $internal_web_property_id ) ) {
					$option['internalWebPropertyID'] = $internal_web_property_id;
				}

				/**
				 * Filters the Google Analytics profile / view ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $profile_id Empty by default, will fall back to the option value if not set.
				 */
				$profile_id = apply_filters( 'googlesitekit_analytics_view_id', '' );
				if ( ! empty( $profile_id ) ) {
					$option['profileID'] = $profile_id;
				}

				/**
				 * Filters the linked state of AdSense with Analytics.
				 *
				 * This filter exists so that adsenseLinked can only be truthy if the AdSense module is active,
				 * regardless of the saved setting.
				 *
				 * @since 1.3.0
				 * @param bool $adsense_linked Null by default, will fallback to the option value if not set.
				 */
				$adsense_linked = apply_filters( 'googlesitekit_analytics_adsense_linked', null );
				if ( is_bool( $adsense_linked ) ) {
					$option['adsenseLinked'] = $adsense_linked;
				}

				/**
				 * Filters the state of the can use snipped setting.
				 *
				 * This filter exists so that useSnippet can be restored to true when the Tag Manager module
				 * is disconnected, ensuring the Analytics snippet is always included.
				 *
				 * @since 1.28.0
				 * @since 1.75.0 Added the `$property_id` parameter.
				 *
				 * @param bool   $can_use_snippet Whether or not `useSnippet` can control snippet output. Default: `true`.
				 * @param string $property_id     The current property ID.
				 */
				$can_use_snippet = apply_filters( 'googlesitekit_analytics_can_use_snippet', true, $property_id );
				if ( is_bool( $can_use_snippet ) ) {
					$option['canUseSnippet'] = $can_use_snippet;
				}

				return $option;
			}
		);
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.16.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			'accountID',
			'internalWebPropertyID',
			'profileID',
			'propertyID',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.2.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'               => 0,
			'accountID'             => '',
			'adsenseLinked'         => false,
			'adsConversionID'       => '',
			'anonymizeIP'           => true,
			'internalWebPropertyID' => '',
			'profileID'             => '',
			'propertyID'            => '',
			'trackingDisabled'      => array( 'loggedinUsers' ),
			'useSnippet'            => true,
			'canUseSnippet'         => true,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.6.0
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
				if ( isset( $option['anonymizeIP'] ) ) {
					$option['anonymizeIP'] = (bool) $option['anonymizeIP'];
				}
				if ( isset( $option['trackingDisabled'] ) ) {
					$option['trackingDisabled'] = (array) $option['trackingDisabled'];
				}
				if ( isset( $option['adsenseLinked'] ) ) {
					$option['adsenseLinked'] = (bool) $option['adsenseLinked'];
				}
			}
			return $option;
		};
	}
}
