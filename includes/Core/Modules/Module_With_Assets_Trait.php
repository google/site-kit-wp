<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Assets_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Assets\Asset;

/**
 * Trait for a module that includes assets.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Module_With_Assets_Trait {

	/**
	 * List of the module's Asset objects to register.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $registerable_assets;

	/**
	 * Gets the assets to register for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of Asset objects.
	 */
	public function get_assets() {
		if ( null === $this->registerable_assets ) {
			$this->registerable_assets = $this->setup_assets();
		}

		return $this->registerable_assets;
	}

	/**
	 * Enqueues all assets necessary for the module.
	 *
	 * This default implementation simply enqueues all assets that the module
	 * has registered.
	 *
	 * @since n.e.x.t
	 */
	public function enqueue_assets() {
		$assets = $this->get_assets();
		array_walk(
			$assets,
			function( Asset $asset ) {
				$asset->enqueue();
			}
		);
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of Asset objects.
	 */
	abstract protected function setup_assets();
}
