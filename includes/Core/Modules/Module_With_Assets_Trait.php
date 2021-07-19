<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Assets_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Assets\Asset;

/**
 * Trait for a module that includes assets.
 *
 * @since 1.7.0
 * @access private
 * @ignore
 */
trait Module_With_Assets_Trait {

	/**
	 * List of the module's Asset objects to register.
	 *
	 * @since 1.7.0
	 * @var array
	 */
	protected $registerable_assets;

	/**
	 * Gets the assets to register for the module.
	 *
	 * @since 1.7.0
	 *
	 * @return Asset[] List of Asset objects.
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
	 * @since 1.7.0
	 * @since 1.37.0 Added the $asset_context argument; only enqueue assets in the correct context.
	 *
	 * @param string $asset_context The page context to load this asset, see `Asset::CONTEXT_*` constants.
	 */
	public function enqueue_assets( $asset_context = Asset::CONTEXT_ADMIN_SITEKIT ) {
		$assets = $this->get_assets();
		array_walk(
			$assets,
			function( Asset $asset, $index, $asset_context ) {
				if ( $asset->has_context( $asset_context ) ) {
					$asset->enqueue();
				}
			},
			$asset_context
		);
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.7.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	abstract protected function setup_assets();
}
