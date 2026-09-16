<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

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
			'ownerID'                          => 0,
			'accountID'                        => '',
			/**
			 * This setting is deprecated and only remains for backwards
			 * compatibility with old migrations.
			 *
			 * See: https://github.com/google/site-kit-wp/pull/12394#pullrequestreview-4068317046
			 *
			 * @deprecated
			 */
			'adsConversionID'                  => '',
			'propertyID'                       => '',
			'webDataStreamID'                  => '',
			'measurementID'                    => '',
			'trackingDisabled'                 => array( 'loggedinUsers' ),
			'useSnippet'                       => true,
			'googleTagID'                      => '',
			'googleTagAccountID'               => '',
			'googleTagContainerID'             => '',
			'googleTagContainerDestinationIDs' => null,
			'googleTagLastSyncedAtMs'          => 0,
			'availableCustomDimensions'        => null,
			'propertyCreateTime'               => 0,
			'adSenseLinked'                    => false,
			'adSenseLinkedLastSyncedAt'        => 0,
			'adsLinked'                        => false,
			'adsLinkedLastSyncedAt'            => 0,
			'detectedEvents'                   => array(),
			'newConversionEventsLastUpdateAt'  => 0,
			'lostConversionEventsLastUpdateAt' => 0,
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
				$this->sanitize_boolean_properties( $option );
				$this->sanitize_google_tag_id( $option );
				$this->sanitize_tracking_disabled( $option );
				$this->sanitize_numeric_properties( $option );
				$this->sanitize_container_destination_ids( $option );
				$this->sanitize_available_custom_dimensions( $option );
				$this->sanitize_timestamp_properties( $option );
			}

			return $option;
		};
	}

	/**
	 * Sanitizes boolean properties.
	 *
	 * @since 1.185.0
	 *
	 * @param array &$option The option array to sanitize.
	 */
	private function sanitize_boolean_properties( &$option ) {
		$boolean_properties = array( 'useSnippet', 'adSenseLinked', 'adsLinked' );
		foreach ( $boolean_properties as $property ) {
			if ( isset( $option[ $property ] ) ) {
				$option[ $property ] = (bool) $option[ $property ];
			}
		}
	}

	/**
	 * Sanitizes Google Tag ID.
	 *
	 * @since 1.185.0
	 *
	 * @param array &$option The option array to sanitize.
	 */
	private function sanitize_google_tag_id( &$option ) {
		if ( isset( $option['googleTagID'] ) ) {
			if ( ! preg_match( '/^(G|GT|AW)-[a-zA-Z0-9]+$/', $option['googleTagID'] ) ) {
				$option['googleTagID'] = '';
			}
		}
	}

	/**
	 * Sanitizes tracking disabled array.
	 *
	 * Prevents other options from being saved if 'loggedinUsers' is selected.
	 *
	 * @since 1.185.0
	 *
	 * @param array &$option The option array to sanitize.
	 */
	private function sanitize_tracking_disabled( &$option ) {
		if ( isset( $option['trackingDisabled'] ) ) {
			// Ensure it's an array first.
			$tracking_disabled = (array) $option['trackingDisabled'];
			// Prevent other options from being saved if 'loggedinUsers' is selected.
			if ( in_array( 'loggedinUsers', $tracking_disabled, true ) ) {
				$option['trackingDisabled'] = array( 'loggedinUsers' );
			} else {
				$option['trackingDisabled'] = $tracking_disabled;
			}
		}
	}

	/**
	 * Sanitizes numeric properties.
	 *
	 * Validates that numeric properties are positive values or empty strings.
	 *
	 * @since 1.185.0
	 *
	 * @param array &$option The option array to sanitize.
	 */
	private function sanitize_numeric_properties( &$option ) {
		$numeric_properties = array( 'googleTagAccountID', 'googleTagContainerID' );
		foreach ( $numeric_properties as $numeric_property ) {
			if ( isset( $option[ $numeric_property ] ) ) {
				if ( ! is_numeric( $option[ $numeric_property ] ) || intval( $option[ $numeric_property ] ) <= 0 ) {
					$option[ $numeric_property ] = '';
				}
			}
		}
	}

	/**
	 * Sanitizes container destination IDs.
	 *
	 * @since 1.185.0
	 *
	 * @param array &$option The option array to sanitize.
	 */
	private function sanitize_container_destination_ids( &$option ) {
		if ( isset( $option['googleTagContainerDestinationIDs'] ) ) {
			if ( ! is_array( $option['googleTagContainerDestinationIDs'] ) ) {
				$option['googleTagContainerDestinationIDs'] = null;
			}
		}
	}

	/**
	 * Sanitizes available custom dimensions.
	 *
	 * Validates that custom dimensions are strings starting with 'googlesitekit_' prefix.
	 *
	 * @since 1.185.0
	 *
	 * @param array &$option The option array to sanitize.
	 */
	private function sanitize_available_custom_dimensions( &$option ) {
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
	}

	/**
	 * Sanitizes timestamp properties.
	 *
	 * Validates that timestamp properties are integers or defaults to 0.
	 *
	 * @since 1.185.0
	 *
	 * @param array &$option The option array to sanitize.
	 */
	private function sanitize_timestamp_properties( &$option ) {
		$timestamp_properties = array(
			'adSenseLinkedLastSyncedAt',
			'adsLinkedLastSyncedAt',
			'newConversionEventsLastUpdateAt',
			'lostConversionEventsLastUpdateAt',
		);
		foreach ( $timestamp_properties as $timestamp_property ) {
			if ( isset( $option[ $timestamp_property ] ) ) {
				if ( ! is_int( $option[ $timestamp_property ] ) ) {
					$option[ $timestamp_property ] = 0;
				}
			}
		}
	}
}
