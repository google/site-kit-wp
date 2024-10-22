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
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;

/**
 * Class representing the Sign in With Google module.
 *
 * @since 1.137.0
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
	 * @since 1.137.0
	 */
	public function register() {
		add_action( 'login_form', array( $this, 'render_signin_button' ) );
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
	 * Registers and Enqueues the sign in button script.
	 *
	 * @since n.e.x.t
	 */
	protected function register_and_enqueue_script() {
		$sign_in_script = new Script(
			'googlesitekit-sign-in-with-google-sign-in-button',
			array(
				'src'       => 'https://accounts.google.com/gsi/client',
				'execution' => 'async',
			)
		);
		$sign_in_script->register( $this->context );
		$sign_in_script->enqueue();
	}

	/**
	 * Registers and Enqueues the sign in button styles.
	 *
	 * @since n.e.x.t
	 */
	protected function register_and_enqueue_style() {
		$this->assets->enqueue_asset( 'googlesitekit-wp-login-css' );
	}

	/**
	 * Renders the sign in button.
	 *
	 * @since n.e.x.t
	 */
	public function render_signin_button() {
		$settings = $this->get_settings()->get();

		$redirect_url = rest_url( '/' . REST_Routes::REST_ROOT . '/modules/sign-in-with-google/auth/google' );

		if ( substr( wp_login_url(), 0, 5 ) !== 'https' || ! $settings['clientID'] ) {
			return;
		}

		// Register and enqueue the script required for the sign in button.
		$this->register_and_enqueue_script();

		// Enqueue styles.
		$this->register_and_enqueue_style();

		// Render the Sign in with Google button.
		?>
<div id="g_id_onload"
	data-client_id="<?php echo esc_attr( $settings['clientID'] ); ?>"
	data-login_uri="<?php echo esc_url( $redirect_url ); ?>"
	data-auto_prompt="false">
</div>
<div class="g_id_signin"
	data-type="standard"
	data-size="large"
	data-theme="<?php echo esc_attr( $settings['theme'] ); ?>"
	data-text="<?php echo esc_attr( $settings['text'] ); ?>"
	data-shape="<?php echo esc_attr( $settings['shape'] ); ?>"
	data-logo_alignment="left">
</div>
		<?php
	}
}