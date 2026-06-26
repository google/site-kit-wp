<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Site_Goals_Site_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Util\Sanitize;

/**
 * Class for site-wide Site Goals settings.
 *
 * @since 1.182.0
 * @access private
 * @ignore
 */
class Site_Goals_Site_Settings extends Setting {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_analytics-4_site_goals_site_settings';

	/**
	 * Allowed values for the `activeWidgets` key.
	 */
	const ALLOWED_WIDGETS = array( 'ecommerce', 'lead' );

	/**
	 * Gets the default value for settings.
	 *
	 * @since 1.182.0
	 *
	 * @return array The default value.
	 */
	public function get_default() {
		return array(
			'activeWidgets' => array(),
		);
	}

	/**
	 * Gets the type of the setting.
	 *
	 * @since 1.182.0
	 *
	 * @return string The type of the setting.
	 */
	public function get_type() {
		return 'array';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.182.0
	 *
	 * @return callable The sanitization callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $option ) {
			return $this->sanitize( $option );
		};
	}

	/**
	 * Merges the given settings with the existing ones, unioning activeWidgets
	 * so that existing values are never dropped.
	 *
	 * @since 1.182.0
	 *
	 * @param array $settings The settings to merge.
	 * @return array The merged settings.
	 */
	public function merge( $settings ) {
		$existing = $this->get();

		if ( isset( $settings['activeWidgets'] ) && is_array( $settings['activeWidgets'] ) ) {
			$settings['activeWidgets'] = array_values(
				array_unique(
					array_merge(
						$existing['activeWidgets'] ?? array(),
						$settings['activeWidgets']
					)
				)
			);
		}

		$merged = array_merge( $existing, $settings );
		$this->set( $merged );

		return $merged;
	}

	/**
	 * Sanitizes the settings.
	 *
	 * @since 1.182.0
	 *
	 * @param array $option The option to sanitize.
	 * @return array The sanitized settings.
	 */
	private function sanitize( $option ) {
		$new_option = $this->get_default();

		if ( isset( $option['activeWidgets'] ) && is_array( $option['activeWidgets'] ) ) {
			$new_option['activeWidgets'] = array_values(
				array_unique(
					array_intersect(
						Sanitize::sanitize_string_list( $option['activeWidgets'] ),
						self::ALLOWED_WIDGETS
					)
				)
			);
		}

		return $new_option;
	}
}
