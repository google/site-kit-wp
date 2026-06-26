<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Advanced_Data_Breakdowns_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Interface;

/**
 * Class for reading and writing the advanced data breakdowns settings.
 *
 * The setting stores a map of property ID to enabled flag, so each Analytics
 * property keeps its own state, for example `array( '123456789' => true )`.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Advanced_Data_Breakdowns_Settings extends Setting implements Setting_With_ViewOnly_Keys_Interface {

	/**
	 * Option name that stores the advanced data breakdowns settings.
	 */
	public const OPTION = 'googlesitekit_analytics-4_advanced_data_breakdowns';

	/**
	 * Gets the default settings, an empty map with no property enabled.
	 *
	 * @since 1.181.0
	 * @since 1.182.0 Returned an empty array, since the setting now stores a per-property map.
	 *
	 * @return array Default settings, an empty map.
	 */
	public function get_default(): array {
		return array();
	}

	/**
	 * Gets the setting's storage type.
	 *
	 * @since 1.181.0
	 *
	 * @return string The storage type, `object`.
	 */
	public function get_type(): string {
		return 'object';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.181.0
	 * @since 1.182.0 Cast each property's value to a boolean, since the setting now stores a per-property map.
	 *
	 * @return callable Callback that casts each property's value to a boolean and keeps the stored value when the input isn't an array.
	 */
	protected function get_sanitize_callback(): callable {
		return function ( $option ): array {
			if ( ! is_array( $option ) ) {
				return $this->get();
			}

			return array_map(
				fn( $is_enabled ) => (bool) $is_enabled,
				$option
			);
		};
	}

	/**
	 * Gets the keys a view-only user is allowed to read.
	 *
	 * @since 1.181.0
	 * @since 1.182.0 Returned the stored property IDs, since the setting now stores a per-property map.
	 *
	 * @return array Property IDs a view-only user may read.
	 */
	public function get_view_only_keys(): array {
		return array_keys( $this->get() );
	}

	/**
	 * Checks whether advanced data breakdowns is enabled for the given property.
	 *
	 * @since 1.181.0
	 * @since 1.182.0 Added a property ID parameter, since the setting now stores a per-property map.
	 *
	 * @param string $property_id Property ID to check the enabled flag for.
	 * @return bool True when enabled for the property, false otherwise.
	 */
	public function is_enabled( string $property_id ): bool {
		$settings = $this->get();

		return ! empty( $settings[ $property_id ] );
	}

	/**
	 * Merges the given settings with the existing ones. Keeps existing values
	 * for property IDs not present in the given settings.
	 *
	 * @since 1.181.0
	 * @since 1.182.0 Used `array_replace` so the numeric property-ID keys are kept.
	 *
	 * @param array $settings Settings to merge in. Property IDs not given keep their stored value.
	 * @return array The full settings after the merge.
	 */
	public function merge( array $settings ): array {
		$existing_settings = $this->get();

		// Use `array_replace`, not `array_merge`: property IDs are numeric keys,
		// and `array_merge` renumbers integer keys, which would lose them.
		$updated_settings = array_replace( $existing_settings, $settings );

		$this->set( $updated_settings );

		return $updated_settings;
	}
}
