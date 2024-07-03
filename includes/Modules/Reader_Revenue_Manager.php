<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;

/**
 * Class representing the Reader Revenue Manager module.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
final class Reader_Revenue_Manager extends Module implements Module_With_Scopes, Module_With_Assets {
	use Module_With_Assets_Trait;
	use Module_With_Scopes_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'reader-revenue-manager';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.130.0
	 */
	public function register() {
		$this->register_scopes_hook();
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.130.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/subscribewithgoogle.publications.readonly',
		);
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.130.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Reader Revenue Manager', 'Service name', 'google-site-kit' ),
			'description' => __( 'Reader Revenue Manager helps publishers grow, retain, and engage their audiences, creating new revenue opportunities', 'google-site-kit' ),
			'order'       => 5,
			'homepage'    => __( 'https://readerrevenue.withgoogle.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since n.e.x.t
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-reader-revenue-manager',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-reader-revenue-manager.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}
}
