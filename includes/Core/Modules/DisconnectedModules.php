<?php
/**
 * Class Google\Site_Kit\Core\Modules\DisconnectedModules
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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class DisconnectedModules extends Setting {

	const OPTION = 'googlesitekit_disconnected_modules';

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param string $module_slug Module slug to disconnect.
	 * @return bool True on success, false on failure.
	 */
	public function disconnect( $module_slug ) {
		$settings = $this->get();

		return $this->set( array_merge( $settings, array( $module_slug => time() ) ) );
	}
}
