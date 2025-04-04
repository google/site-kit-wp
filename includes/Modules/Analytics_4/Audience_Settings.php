<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Audience_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Interface;

/**
 * Class for Audience_Settings.
 *
 * @since 1.148.0
 * @access private
 * @ignore
 */
class Audience_Settings extends Setting implements Setting_With_ViewOnly_Keys_Interface {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_analytics-4_audience_settings';

	/**
	 * Gets the default value for settings.
	 *
	 * @since 1.148.0
	 *
	 * @return mixed The default value.
	 */
	public function get_default() {
		return array(
			'availableAudiences'                   => null,
			'availableAudiencesLastSyncedAt'       => 0,
			'audienceSegmentationSetupCompletedBy' => null,
		);
	}

	/**
	 * Gets the type of the setting.
	 *
	 * @since 1.148.0
	 *
	 * @return string The type of the setting.
	 */
	public function get_type() {
		return 'array';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.148.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function ( $option ) {
			return $this->sanitize( $option );
		};
	}

	/**
	 * Gets the view-only keys for the setting.
	 *
	 * @since 1.148.0
	 *
	 * @return array List of view-only keys.
	 */
	public function get_view_only_keys() {
		return array(
			'availableAudiences',
			'audienceSegmentationSetupCompletedBy',
		);
	}

	/**
	 * Merges the given settings with the existing ones. It will keep the old settings
	 * value for the properties that are not present in the given settings.
	 *
	 * @since 1.148.0
	 *
	 * @param array $settings The settings to merge.
	 *
	 * @return array The merged settings.
	 */
	public function merge( $settings ) {
		$existing_settings = $this->get();
		$updated_settings  = array_merge( $existing_settings, $settings );

		$this->set( $updated_settings );

		return $updated_settings;
	}

	/**
	 * Sanitizes the settings.
	 *
	 * @since 1.148.0
	 *
	 * @param array $option The option to sanitize.
	 *
	 * @return array The sanitized settings.
	 */
	private function sanitize( $option ) {
		$new_option = $this->get();

		if ( isset( $option['availableAudiences'] ) ) {
			if ( is_array( $option['availableAudiences'] ) ) {
				$new_option['availableAudiences'] = $option['availableAudiences'];
			} else {
				$new_option['availableAudiences'] = null;
			}
		}

		if ( isset( $option['availableAudiencesLastSyncedAt'] ) ) {
			if ( is_int( $option['availableAudiencesLastSyncedAt'] ) ) {
				$new_option['availableAudiencesLastSyncedAt'] = $option['availableAudiencesLastSyncedAt'];
			} else {
				$new_option['availableAudiencesLastSyncedAt'] = 0;
			}
		}

		if ( isset( $option['audienceSegmentationSetupCompletedBy'] ) ) {
			if ( is_int( $option['audienceSegmentationSetupCompletedBy'] ) ) {
				$new_option['audienceSegmentationSetupCompletedBy'] = $option['audienceSegmentationSetupCompletedBy'];
			} else {
				$new_option['audienceSegmentationSetupCompletedBy'] = null;
			}
		}

		return $new_option;
	}
}
