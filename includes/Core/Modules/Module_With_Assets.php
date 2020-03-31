<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Assets
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Assets\Asset;

/**
 * Interface for a module that includes assets.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Module_With_Assets {

	/**
	 * Gets the assets to register for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of Asset objects.
	 */
	public function get_assets();

	/**
	 * Enqueues all assets necessary for the module.
	 *
	 * @since n.e.x.t
	 */
	public function enqueue_assets();
}
