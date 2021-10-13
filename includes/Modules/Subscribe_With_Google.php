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
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.41.0
	 */
	public function register() {
		if ( ! $this->is_connected() ) {
			return;
		}

		add_filter( 'the_content', array( __CLASS__, 'filter_the_content' ) );
	}

	/**
	 * Filters content of Posts.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Initial content of Post.
	 * @return string Filtered content of Post.
	 */
	public function filter_the_content( $content ) {
		// Check if we're inside the main loop in a single post page.
		if ( ! is_single() || ! is_main_query() ) {
			return $content;
		}

		// Mocking disabling paywall for free posts.
		$access = get_post_meta( get_the_ID(), 'googlesitekitpersistent_access', true );
		if ( ! $access || 'openaccess' === $access ) {
			return $content;
		}

		$more_tag         = '<span id="more-' . get_the_ID() . '"></span>';
		$content_segments = explode( $more_tag, $content );

		// Add Paywall wrapper.
		if ( count( $content_segments ) > 1 ) {
			$content_segments[1] = '
<div class="swg--locked-content">
' . $content_segments[1] . '
</div>
	';
		}

		$content = implode( $more_tag, $content_segments );

		// Mocked styles and script.
		$content = '
<style>
.swg--locked-content {
	display: none;
}
body.swg--unlocked .swg--locked-content {
	display: initial;
}
</style>
<script>
setTimeout(() => {
	const unlocked = confirm("Unlock page?");
	document.body.classList.toggle("swg--unlocked", unlocked);
}, 1234);
</script>
' . $content;

		return $content;
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

}
