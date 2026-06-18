<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\User_Setting;
use Google\Site_Kit\Core\Util\Sanitize;

/**
 * Class for per-user Site Goals settings.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Site_Goals_Settings extends User_Setting {

	/**
	 * The user option name for Site Goals settings.
	 */
	const OPTION = 'googlesitekit_analytics-4_site_goals_settings';

	/**
	 * Allowed top-level setting keys.
	 */
	const SETTING_KEYS = array( 'goalDrivers', 'visitorEngagement' );

	/**
	 * Per-setting goal type sub-keys.
	 */
	const GOAL_TYPE_KEYS = array( 'ecommerce', 'lead' );

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.181.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.181.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since 1.181.0
	 *
	 * @param array $partial Partial settings array to save.
	 * @return bool True on success, false on failure.
	 */
	public function merge( array $partial ) {
		// Drop null values so a partial save preserves existing keys instead of
		// overwriting them. Unknown keys are dropped by the sanitize callback on set().
		$partial = array_filter(
			$partial,
			function ( $value ) {
				return null !== $value;
			}
		);

		return $this->set( array_merge( $this->get(), $partial ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.181.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			$sanitized_settings = array();

			foreach ( self::SETTING_KEYS as $key ) {
				if ( isset( $settings[ $key ] ) && is_array( $settings[ $key ] ) ) {
					$sanitized_settings[ $key ] = $this->sanitize_goal_type_selections( $settings[ $key ] );
				}
			}

			return $sanitized_settings;
		};
	}

	/**
	 * Sanitizes the per-goal-type selections, validating `ecommerce` and `lead`
	 * sub-keys as string arrays.
	 *
	 * @since 1.181.0
	 *
	 * @param array $selections Goal type selections to sanitize.
	 * @return array The sanitized selections.
	 */
	private function sanitize_goal_type_selections( $selections ) {
		$sanitized = array();

		foreach ( self::GOAL_TYPE_KEYS as $goal_type ) {
			if ( isset( $selections[ $goal_type ] ) && is_array( $selections[ $goal_type ] ) ) {
				$sanitized[ $goal_type ] = Sanitize::sanitize_string_list( $selections[ $goal_type ] );
			}
		}

		return $sanitized;
	}
}
