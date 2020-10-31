<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;

/**
 * Class for Analytics 4 settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_analytics_4_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
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

				return $option;
			}
		);
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			'accountID',
			'propertyID',
			'datastreamID',
			'measurementID',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'          => 0,
			'accountID'        => '',
			'propertyID'       => '',
			'datastreamID'     => '',
			'measurementID'    => '',
			'adsenseLinked'    => false,
			'anonymizeIP'      => true,
			'trackingDisabled' => array( 'loggedinUsers' ),
			'useSnippet'       => true,
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
