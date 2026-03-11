<?php
/**
 * Class Google\Site_Kit\Core\Modules\Disconnected_Modules
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for disconnected modules settings.
 *
 * @since 1.172.0
 * @access private
 * @ignore
 */
class Disconnected_Modules extends Setting {

	const OPTION = 'googlesitekit_disconnected_modules';

	/**
	 * Gets the default value.
	 *
	 * @since 1.172.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.172.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Adds a module to the list of disconnected modules
	 * alongwith the timestamp of disconnection.
	 *
	 * @since 1.172.0
	 *
	 * @param string $module_slug Module slug to disconnect.
	 * @return bool True on success, false on failure.
	 */
	public function add( $module_slug ) {
		$settings = $this->get();

		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		return $this->set( array_merge( $settings, array( $module_slug => time() ) ) );
	}

	/**
	 * Removes a module from the list of disconnected modules.
	 *
	 * @since 1.172.0
	 *
	 * @param string $module_slug Module slug to remove.
	 * @return bool True on success, false on failure.
	 */
	public function remove( $module_slug ) {
		$settings = $this->get();

		if ( ! is_array( $settings ) || ! array_key_exists( $module_slug, $settings ) ) {
			return false;
		}

		unset( $settings[ $module_slug ] );

		return $this->set( $settings );
	}
}
