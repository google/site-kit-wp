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
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;

/**
 * Class representing the Sign in With Google module.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
final class Sign_In_With_Google extends Module implements Module_With_Assets, Module_With_Settings, Module_With_Deactivation {

	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'sign-in-with-google';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 */
	public function register() {
		add_action( 'login_form', $this->get_method_proxy( 'render_signin_button' ) );
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.137.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.137.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Sign in with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Improve user engagement, trust, and data privacy, while creating a simple, secure, and personalized experience for your visitors', 'google-site-kit' ),
			'order'       => 10,
			'homepage'    => __( 'https://developers.google.com/identity/gsi/web/guides/overview', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.137.0
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
	 * @since 1.137.0
	 *
	 * @return Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.139.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$options = $this->get_settings()->get();

		if ( empty( $options['clientID'] ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Renders the sign in button.
	 *
	 * @since 1.139.0
	 */
	private function render_signin_button() {
		$settings = $this->get_settings()->get();
		if ( ! $settings['clientID'] ) {
			return;
		}

		$redirect_url = site_url( '/auth/google' );
		if ( substr( $redirect_url, 0, 5 ) !== 'https' ) {
			return;
		}

		// Render the Sign in with Google button and related inline styles.
		?>
<!-- <?php echo esc_html__( 'Sign in with Google button added by Site Kit', 'google-site-kit' ); ?> -->
<?php /* phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript */ ?>
<script src="https://accounts.google.com/gsi/client"></script>
<script>
( () => {
	google.accounts.id.initialize({
		client_id: '<?php echo esc_js( $settings['clientID'] ); ?>',
		login_uri: '<?php echo esc_js( $redirect_url ); ?>',
	});
	const parent = document.createElement( 'div' );
	document.getElementById( 'login').insertBefore( parent, document.getElementById( 'loginform' ) );
	google.accounts.id.renderButton(parent, {
		theme: '<?php echo esc_js( $settings['theme'] ); ?>',
		text: '<?php echo esc_js( $settings['text'] ); ?>',
		shape: '<?php echo esc_js( $settings['shape'] ); ?>'
	});
} )();
</script>
<!-- <?php echo esc_html__( 'End Sign in with Google button added by Site Kit', 'google-site-kit' ); ?> -->
		<?php
	}
}
