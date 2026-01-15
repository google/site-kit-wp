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
	 * Merges a partial array of `module_slug => disconnected_timestamp`
	 * to existing disconnected modules.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $partial Partial settings array to save.
	 * @return bool True on success, false on failure.
	 */
	public function merge( array $partial ) {
		$settings = $this->get();

		return $this->set( array_merge( $settings, $partial ) );
	}
}
