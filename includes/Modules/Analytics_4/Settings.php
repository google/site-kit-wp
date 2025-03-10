<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable Generic.Metrics.CyclomaticComplexity.MaxExceeded

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Interface;
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
		return array(
			'availableCustomDimensions',
			'adSenseLinked',
			'availableAudiences',
			'audienceSegmentationSetupCompletedBy',
			'detectedEvents',
			'newConversionEventsLastUpdateAt',
			'lostConversionEventsLastUpdateAt',
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
			'ownerID'                              => 0,
			'accountID'                            => '',
			'adsConversionID'                      => '',
			'propertyID'                           => '',
			'webDataStreamID'                      => '',
			'measurementID'                        => '',
			'trackingDisabled'                     => array( 'loggedinUsers' ),
			'useSnippet'                           => true,
			'googleTagID'                          => '',
			'googleTagAccountID'                   => '',
			'googleTagContainerID'                 => '',
			'googleTagContainerDestinationIDs'     => null,
			'googleTagLastSyncedAtMs'              => 0,
			'availableCustomDimensions'            => null,
			'propertyCreateTime'                   => 0,
			'adSenseLinked'                        => false,
			'adSenseLinkedLastSyncedAt'            => 0,
			'adsConversionIDMigratedAtMs'          => 0,
			'adsLinked'                            => false,
			'adsLinkedLastSyncedAt'                => 0,
			'availableAudiences'                   => null,
			'availableAudiencesLastSyncedAt'       => 0,
			'audienceSegmentationSetupCompletedBy' => null,
			'detectedEvents'                       => array(),
			'newConversionEventsLastUpdateAt'      => 0,
			'lostConversionEventsLastUpdateAt'     => 0,
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
		return function ( $option ) {
			if ( is_array( $option ) ) {
				if ( isset( $option['useSnippet'] ) ) {
					$option['useSnippet'] = (bool) $option['useSnippet'];
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

				$numeric_properties = array( 'googleTagAccountID', 'googleTagContainerID' );
				foreach ( $numeric_properties as $numeric_property ) {
					if ( isset( $option[ $numeric_property ] ) ) {
						if ( ! is_numeric( $option[ $numeric_property ] ) || ! $option[ $numeric_property ] > 0 ) {
							$option[ $numeric_property ] = '';
						}
					}
				}

				if ( isset( $option['googleTagContainerDestinationIDs'] ) ) {
					if ( ! is_array( $option['googleTagContainerDestinationIDs'] ) ) {
						$option['googleTagContainerDestinationIDs'] = null;
					}
				}

				if ( isset( $option['availableCustomDimensions'] ) ) {
					if ( is_array( $option['availableCustomDimensions'] ) ) {
						$valid_dimensions = array_filter(
							$option['availableCustomDimensions'],
							function ( $dimension ) {
								return is_string( $dimension ) && strpos( $dimension, 'googlesitekit_' ) === 0;
							}
						);

						$option['availableCustomDimensions'] = array_values( $valid_dimensions );
					} else {
						$option['availableCustomDimensions'] = null;
					}
				}

				if ( isset( $option['adSenseLinked'] ) ) {
					$option['adSenseLinked'] = (bool) $option['adSenseLinked'];
				}

				if ( isset( $option['adSenseLinkedLastSyncedAt'] ) ) {
					if ( ! is_int( $option['adSenseLinkedLastSyncedAt'] ) ) {
						$option['adSenseLinkedLastSyncedAt'] = 0;
					}
				}

				if ( isset( $option['adsConversionIDMigratedAtMs'] ) ) {
					if ( ! is_int( $option['adsConversionIDMigratedAtMs'] ) ) {
						$option['adsConversionIDMigratedAtMs'] = 0;
					}
				}

				if ( isset( $option['adsLinked'] ) ) {
					$option['adsLinked'] = (bool) $option['adsLinked'];
				}

				if ( isset( $option['adsLinkedLastSyncedAt'] ) ) {
					if ( ! is_int( $option['adsLinkedLastSyncedAt'] ) ) {
						$option['adsLinkedLastSyncedAt'] = 0;
					}
				}

				if ( isset( $option['availableAudiences'] ) ) {
					if ( ! is_array( $option['availableAudiences'] ) ) {
						$option['availableAudiences'] = null;
					}
				}

				if ( isset( $option['availableAudiencesLastSyncedAt'] ) ) {
					if ( ! is_int( $option['availableAudiencesLastSyncedAt'] ) ) {
						$option['availableAudiencesLastSyncedAt'] = 0;
					}
				}

				if ( isset( $option['audienceSegmentationSetupCompletedBy'] ) ) {
					if ( ! is_int( $option['audienceSegmentationSetupCompletedBy'] ) ) {
						$option['audienceSegmentationSetupCompletedBy'] = null;
					}
				}

				if ( isset( $option['newConversionEventsLastUpdateAt'] ) ) {
					if ( ! is_int( $option['newConversionEventsLastUpdateAt'] ) ) {
						$option['newConversionEventsLastUpdateAt'] = 0;
					}
				}

				if ( isset( $option['lostConversionEventsLastUpdateAt'] ) ) {
					if ( ! is_int( $option['lostConversionEventsLastUpdateAt'] ) ) {
						$option['lostConversionEventsLastUpdateAt'] = 0;
					}
				}
			}

			return $option;
		};
	}
}
