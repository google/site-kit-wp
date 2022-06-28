<?php
/**
 * Class Google\Site_Kit\Modules\Thank_With_Google
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Thank_With_Google\Settings;

/**
 * Class representing the Thank with Google module.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Thank_With_Google extends Module
	implements Module_With_Assets, Module_With_Deactivation, Module_With_Owner, Module_With_Settings {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'thank-with-google';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		if ( ! $this->is_connected() ) {
			return;
		}
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$settings = $this->get_settings()->get();

		if ( ! $settings ) {
			return false;
		}

		if ( ! $settings['products'] ) {
			return false;
		}

		if ( ! $settings['publicationID'] ) {
			return false;
		}

		if ( ! $settings['revenueModel'] ) {
			return false;
		}

		return parent::is_connected();
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
			'slug'        => 'thank-with-google',
			'name'        => _x( 'Thank with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Let your supporters show appreciation of your work through virtual stickers and personal messages', 'google-site-kit' ),
			'order'       => 7,
			'homepage'    => __( 'https://publishercenter.google.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
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
				'googlesitekit-modules-thank-with-google',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-thank-with-google.js',
					'dependencies' => array(
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-datastore-site',
						'googlesitekit-modules',
						'googlesitekit-vendor',
					),
				)
			),
		);
	}

}
