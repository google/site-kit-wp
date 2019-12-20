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

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Util\Migrate_Legacy_Keys;

/**
 * Class for Analytics settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Setting {
	use Migrate_Legacy_Keys;

	const OPTION = 'googlesitekit_analytics_settings';

	/**
	 * Mapping of legacy keys to current key.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $legacy_key_map = array(
		'accountId'             => 'accountID',
		'profileId'             => 'profileID',
		'propertyId'            => 'propertyID',
		'internalWebPropertyId' => 'internalWebPropertyID',
	);

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		register_setting(
			self::OPTION,
			self::OPTION,
			array(
				'type'              => 'object',
				'sanitize_callback' => $this->get_sanitize_callback(),
				'default'           => $this->get_default(),
			)
		);

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
				if ( ! is_array( $option ) ) {
					$option = $this->get_default();
				} else {
					$option = $this->migrate_legacy_keys( $option );
				}

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

				// Fill in any missing keys with defaults.
				return $option + $this->get_default();
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
