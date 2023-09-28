<?php
/**
 * Trait Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Trait
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Trait for a Setting that has view-only option keys.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Setting_With_ViewOnly_Keys_Trait {

	/**
	 * Returns keys for view-only settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array An array of keys for view-only settings keys.
	 */
	abstract public function get_view_only_keys();

	/**
	 * Compares all the saved settings with the view-only keys, to return view-only settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array An array of keys for view-only settings.
	 */
	public function get_view_only_settings() {
		$read_only_keys = $this->get_view_only_keys();
		$settings       = $this->get();

		if ( empty( $read_only_keys ) || empty( $settings ) ) {
			return array();
		}

		$read_only_settings = array_intersect_key( $settings, array_flip( $read_only_keys ) );

		return $read_only_settings;
	}
}
