<?php
/**
 * Class Google\Site_Kit\Core\User\Audience_Settings
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Setting;
use Google\Site_Kit\Core\Util\Sanitize;

/**
 * Class for audience settings.
 *
 * @since 1.134.0
 * @access private
 * @ignore
 */
class Audience_Settings extends User_Setting {

	/**
	 * The user option name for audience setting.
	 */
	const OPTION = 'googlesitekit_audience_settings';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.124.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.124.0
	 * @since 1.136.0 Added `didSetAudiences` default value.
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'configuredAudiences'                => null,
			'isAudienceSegmentationWidgetHidden' => false,
			'didSetAudiences'                    => false,
		);
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.124.0
	 * @since 1.138.0 Allow setting `null` for `configuredAudiences`.
	 *
	 * @param array $partial Partial settings array to save.
	 * @return bool True on success, false on failure.
	 */
	public function merge( array $partial ) {
		$settings = $this->get();
		$partial  = array_filter(
			$partial,
			function ( $value, $key ) {
				// Allow setting `null` for `configuredAudiences`.
				return 'configuredAudiences' === $key ? true : null !== $value;
			},
			ARRAY_FILTER_USE_BOTH
		);

		$allowed_settings = array(
			'configuredAudiences'                => true,
			'isAudienceSegmentationWidgetHidden' => true,
			'didSetAudiences'                    => true,
		);

		$updated = array_intersect_key( $partial, $allowed_settings );

		if ( empty( $settings['didSetAudiences'] )
			&& isset( $updated['configuredAudiences'] )
			&& is_array( $updated['configuredAudiences'] )
			&& ! empty( $updated['configuredAudiences'] )
		) {
			$updated['didSetAudiences'] = true;
		}

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.124.0
	 * @since 1.138.0 Allow setting `null` for `configuredAudiences`.
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			$sanitized_settings = array();

			// Allow setting `null` for `configuredAudiences`.
			if ( array_key_exists( 'configuredAudiences', $settings ) ) {
				$sanitized_settings['configuredAudiences'] = is_null( $settings['configuredAudiences'] )
					? null
					: Sanitize::sanitize_string_list( $settings['configuredAudiences'] );
			}

			if ( isset( $settings['isAudienceSegmentationWidgetHidden'] ) ) {
				$sanitized_settings['isAudienceSegmentationWidgetHidden'] = false !== $settings['isAudienceSegmentationWidgetHidden'];
			}

			if ( isset( $settings['didSetAudiences'] ) ) {
				$sanitized_settings['didSetAudiences'] = false !== $settings['didSetAudiences'];
			}

			return $sanitized_settings;
		};
	}
}
