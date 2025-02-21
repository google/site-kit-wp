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
 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return string The type of the setting.
	 */
	public function get_type() {
		return 'array';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param array $settings The settings to merge.
	 *
	 * @return array The merged settings.
	 */
	public function merge( $settings ) {
		$existing_settings = $this->get();
		$new_settings      = $this->sanitize( $settings, $existing_settings );
		$updated_settings  = array_merge( $existing_settings, $new_settings );

		$this->set( $updated_settings );

		return $updated_settings;
	}

	/**
	 * Sanitizes the settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings The settings to sanitize.
	 * @param array $existing_settings The existing settings to merge with.
	 *
	 * @return array The sanitized settings.
	 */
	private function sanitize( $settings, $existing_settings = null ) {
		$option = $existing_settings ?? $this->get_default();

		if ( isset( $settings['availableAudiences'] ) ) {
			if ( is_array( $settings['availableAudiences'] ) ) {
				$option['availableAudiences'] = $settings['availableAudiences'];
			} else {
				$option['availableAudiences'] = null;
			}
		}

		if ( isset( $settings['availableAudiencesLastSyncedAt'] ) ) {
			if ( is_int( $settings['availableAudiencesLastSyncedAt'] ) ) {
				$option['availableAudiencesLastSyncedAt'] = $settings['availableAudiencesLastSyncedAt'];
			} else {
				$option['availableAudiencesLastSyncedAt'] = 0;
			}
		}

		if ( isset( $settings['audienceSegmentationSetupCompletedBy'] ) ) {
			if ( is_int( $settings['audienceSegmentationSetupCompletedBy'] ) ) {
				$option['audienceSegmentationSetupCompletedBy'] = $settings['audienceSegmentationSetupCompletedBy'];
			} else {
				$option['audienceSegmentationSetupCompletedBy'] = null;
			}
		}

		return $option;
	}
}
