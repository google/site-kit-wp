<?php
/**
 * ModulesHelperTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Core\Modules\Modules;

trait ModulesHelperTrait {

	/**
	 * Activate modules by their given slugs.
	 *
	 * @param string ...$slugs Module slugs to activate.
	 */
	protected function activate_modules( ...$slugs ) {
		$callback = function ( $active_modules ) use ( $slugs ) {
			return array_values(
				array_merge(
					$active_modules ?: array(),
					$slugs
				)
			);
		};

		add_filter( 'default_option_' . Modules::OPTION_ACTIVE_MODULES, $callback );
		add_filter( 'option_' . Modules::OPTION_ACTIVE_MODULES, $callback );
	}

	/**
	 * Force modules to be considered active and connected by their given slugs.
	 *
	 * @param string ...$slugs
	 */
	protected function force_connect_modules( ...$slugs ) {
		add_filter(
			'googlesitekit_is_module_connected',
			function ( $connected, $slug ) use ( $slugs ) {
				// Only connect given slugs.
				return in_array( $slug, $slugs, true ) ?: $connected;
			},
			10,
			2
		);
		// Since the above filter is fulfilled by Modules, it is expected that connected modules must be active.
		$this->activate_modules( ...$slugs );
	}
}
