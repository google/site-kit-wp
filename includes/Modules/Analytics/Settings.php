<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;

/**
 * Class for Analytics settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {
	use Setting_With_Legacy_Keys_Trait;

	const OPTION = 'googlesitekit_analytics_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
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

				return $option;
			}
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_default() {
		return array(
			'accountID'             => '',
			'ampClientIDOptIn'      => true,
			'anonymizeIP'           => true,
			'internalWebPropertyID' => '',
			'profileID'             => '',
			'propertyID'            => '',
			'trackingDisabled'      => array( 'loggedinUsers' ),
			'useSnippet'            => true,
		);
	}
}
