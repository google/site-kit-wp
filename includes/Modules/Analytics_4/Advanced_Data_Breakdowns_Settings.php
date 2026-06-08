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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Advanced_Data_Breakdowns_Settings extends Setting implements Setting_With_ViewOnly_Keys_Interface {

	/**
	 * Option name that stores the advanced data breakdowns settings.
	 */
	public const OPTION = 'googlesitekit_analytics-4_advanced_data_breakdowns';

	/**
	 * Gets the default settings, with advanced data breakdowns disabled.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Default settings, with `enabled` set to `false`.
	 */
	public function get_default(): array {
		return array(
			'enabled' => false,
		);
	}

	/**
	 * Gets the setting's storage type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The storage type, `object`.
	 */
	public function get_type(): string {
		return 'object';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable Callback that casts `enabled` to a boolean and keeps the stored value when the input is not an array.
	 */
	protected function get_sanitize_callback(): callable {
		return function ( $option ): array {
			$new_option = $this->get();

			if ( ! is_array( $option ) ) {
				return $new_option;
			}

			if ( isset( $option['enabled'] ) ) {
				$new_option['enabled'] = (bool) $option['enabled'];
			}

			return $new_option;
		};
	}

	/**
	 * Gets the keys a view-only user is allowed to read.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Keys a view-only user may read, currently just `enabled`.
	 */
	public function get_view_only_keys(): array {
		return array( 'enabled' );
	}

	/**
	 * Checks whether advanced data breakdowns is enabled.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True when enabled, false otherwise.
	 */
	public function is_enabled(): bool {
		$settings = $this->get();

		return ! empty( $settings['enabled'] );
	}

	/**
	 * Merges the given settings with the existing ones. Keeps existing values
	 * for keys not present in the given settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings Settings to merge in. Keys not given keep their stored value.
	 * @return array The full settings after the merge.
	 */
	public function merge( array $settings ): array {
		$existing_settings = $this->get();
		$updated_settings  = array_merge( $existing_settings, $settings );

		$this->set( $updated_settings );

		return $updated_settings;
	}
}
