<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google
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
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;

/**
 * Class representing the Sign in With Google module.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Sign_In_With_Google extends Module implements Module_With_Assets, Module_With_Settings, Module_With_Deactivation {

	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'sign-in-with-google';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since n.e.x.t
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Sign in with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Improve user engagement, trust, and data privacy, while creating a simple, secure, and personalised experience for your visitors', 'google-site-kit' ),
			'order'       => 10,
			'homepage'    => __( 'https://developers.google.com/identity/gsi/web/guides/overview', 'google-site-kit' ),
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
		return array(
			new Script(
				'googlesitekit-modules-sign-in-with-google',
				array(
					'src'          => $this->context->url( 'dist/assets/js/googlesitekit-modules-sign-in-with-google.js' ),
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

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}
}
