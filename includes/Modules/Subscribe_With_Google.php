<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google
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
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Subscribe_With_Google\Settings;
use Google\Site_Kit\Modules\Subscribe_With_Google\Web_Tag;

/**
 * Class representing the Subscribe with Google module.
 *
 * @since 1.41.0
 * @access private
 * @ignore
 */
final class Subscribe_With_Google extends Module
	implements Module_With_Assets, Module_With_Owner, Module_With_Settings {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'subscribe-with-google';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.41.0
	 */
	public function register() {
		if ( ! $this->is_connected() ) {
			return;
		}

		// Add SwG tag.
		add_action( 'template_redirect', $this->get_method_proxy( 'add_swgjs' ) );
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.41.0
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

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.41.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.41.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'subscribe-with-google',
			'name'        => _x( 'Subscribe with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Generate revenue through your content by adding subscriptions or contributions to your publication', 'google-site-kit' ),
			'order'       => 7,
			'homepage'    => __( 'https://publishercenter.google.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.41.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.41.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-subscribe-with-google',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-subscribe-with-google.js',
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

	/**
	 * Adds Swgjs to Posts.
	 *
	 * @since n.e.x.t
	 */
	private function add_swgjs() {
		// Only add Swgjs to Posts.
		if ( ! is_single() ) {
			return;
		}

		// TODO: Support AMP.
		if ( $this->context->is_amp() ) {
			return;
		}

		global $post;
		$product_name    = get_post_meta( $post->ID, 'googlesitekitpersistent_reader_revenue_access', true );
		$product_name    = $product_name ? $product_name : 'openaccess'; // Default to free.
		$module_settings = $this->get_settings();
		$settings        = $module_settings->get();
		$publication_id  = $settings['publicationID'];
		$product_id      = $publication_id . ':' . $product_name;
		$free            = 'openaccess' === $product_name ? 'true' : 'false';

		$swgjs_src = 'https://news.google.com/swg/js/v1/swg-basic.js';
		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script( 'google_swgjs', $swgjs_src, false, null, false );
		wp_script_add_data( 'google_swgjs', 'script_execution', 'async' );
		wp_add_inline_script(
			'google_swgjs',
			'
(self.SWG_BASIC = self.SWG_BASIC || []).push(basicSubscriptions => {
	basicSubscriptions.init({
		type: "NewsArticle",
		isAccessibleForFree: ' . $free . ',
		isPartOfType: ["Product"],
		isPartOfProductId: "' . $product_id . '",
		autoPromptType: "contribution",
		clientOptions: { theme: "light", lang: "en" },
	});
});'
		);
	}

}
