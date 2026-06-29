<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Assets\Manifest;
use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator;

/**
 * Class for Web tag.
 *
 * @since 1.159.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait;

	/**
	 * Module settings.
	 *
	 * @since 1.159.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Whether the current page is the WordPress login page.
	 *
	 * `is_login()` isn't available until WP 6.1.
	 *
	 * @since 1.159.0
	 * @var bool
	 */
	private $is_wp_login;

	/**
	 * Redirect to URL.
	 *
	 * @since 1.159.0
	 * @var string
	 */
	private $redirect_to;

	/**
	 * Whether the tag renders for the existing-user link flow on `wp-admin/profile.php`.
	 *
	 * @since 1.182.0
	 * @var bool
	 */
	private bool $is_existing_user_flow = false;

	/**
	 * Sets the module settings.
	 *
	 * @since 1.159.0
	 *
	 * @param array $settings Module settings as array.
	 */
	public function set_settings( array $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Sets whether the current page is the WordPress login page.
	 *
	 * @since 1.159.0
	 *
	 * @param bool $is_wp_login Whether the current page is the WordPress login page.
	 */
	public function set_is_wp_login( $is_wp_login ) {
		$this->is_wp_login = $is_wp_login;
	}

	/**
	 * Sets the redirect to URL.
	 *
	 * @since 1.159.0
	 *
	 * @param string $redirect_to Redirect to URL.
	 */
	public function set_redirect_to( $redirect_to ) {
		if ( ! empty( $redirect_to ) ) {
			$this->redirect_to = trim( $redirect_to );
		}
	}

	/**
	 * Sets whether the tag renders for the existing-user link flow on `wp-admin/profile.php`.
	 *
	 * @since 1.182.0
	 *
	 * @param bool $is_existing_user_flow Existing-user link flow flag.
	 */
	public function set_is_existing_user_flow( bool $is_existing_user_flow ): void {
		$this->is_existing_user_flow = $is_existing_user_flow;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.159.0
	 * @since 1.182.0 Runs on `admin_footer` for the existing-user link flow.
	 */
	public function register() {
		if ( $this->is_existing_user_flow ) {
			// Output the Sign in with Google JS on the existing-user link flow.
			add_action( 'admin_footer', $this->get_method_proxy( 'render' ) );
		} else {
			// Render the Sign in with Google script that converts placeholder
			// <div>s with Sign in with Google buttons.
			add_action( 'wp_footer', $this->get_method_proxy( 'render' ) );
			// Output the Sign in with Google JS on the WordPress login page.
			add_action( 'login_footer', $this->get_method_proxy( 'render' ) );
		}

		$this->do_init_tag_action();
	}

	/**
	 * Renders the Sign in with Google JS script tags, One Tap code, and
	 * buttons.
	 *
	 * @since 1.139.0
	 * @since 1.144.0 Renamed to `render_signinwithgoogle` and conditionally
	 *                rendered the code to replace buttons.
	 * @since 1.159.0 moved from main Sign_In_With_Google class to Web_Tag.
	 * @since 1.182.0 Added support for the existing-user link flow.
	 */
	protected function render() {
		$is_woocommerce       = class_exists( 'WooCommerce' );
		$is_woocommerce_login = did_action( 'woocommerce_login_form_start' );

		$login_uri = add_query_arg( 'action', Sign_In_With_Google::ACTION_AUTH, wp_login_url() );

		$btn_args = array(
			'theme' => $this->settings['theme'],
			'text'  => $this->settings['text'],
			'shape' => $this->settings['shape'],
		);

		$is_login_page = $this->is_wp_login || $is_woocommerce_login;

		// On login pages, and when a user connects their account from their
		// own profile page, the sign-in response says where to send the user
		// next (eg. back to the profile page). Both cases should follow that
		// redirect instead of reloading the current page, so group them here.
		$follows_post_redirect = $is_login_page || $this->is_existing_user_flow;

		// Check to see if we should show the One Tap prompt on this page.
		//
		// Show the One Tap prompt if:
		// 1. One Tap is enabled in settings.
		// 2. The user is not logged in.
		// 3. The current request is not a post/page preview.
		$should_show_one_tap_prompt = ! empty( $this->settings['oneTapEnabled'] ) && ! is_user_logged_in() && ! is_preview();

		// Set the cookie time to live to 5 minutes. If the redirect_to is
		// empty, set the cookie to expire immediately.
		$cookie_expire_time = ! empty( $this->redirect_to ) ? 5 * MINUTE_IN_SECONDS : 0;

		$config = array(
			'clientID'               => $this->settings['clientID'],
			'defaultButtonOptions'   => $btn_args,
			'loginURI'               => $login_uri,
			'isUserLoggedIn'         => is_user_logged_in(),
			'isWPLogin'              => (bool) $this->is_wp_login,
			'isPreview'              => is_preview(),
			'isWooCommerce'          => $is_woocommerce,
			'isExistingUserFlow'     => $this->is_existing_user_flow,
			'connectNonce'           => $this->is_existing_user_flow ? wp_create_nonce( Authenticator::CONNECT_EXISTING_USER_NONCE_ACTION ) : '',
			'followsPostRedirect'    => $follows_post_redirect,
			'redirectTo'             => $this->redirect_to ?? '',
			'redirectCookieName'     => Authenticator::COOKIE_REDIRECT_TO,
			'redirectCookiePath'     => Authenticator::get_cookie_path(),
			'redirectCookieTTL'      => $cookie_expire_time,
			'shouldShowOneTapPrompt' => $should_show_one_tap_prompt,
		);

		list( $filename ) = Manifest::get( 'sign-in-with-google' );

		if ( ! $filename ) {
			$filename = 'sign-in-with-google.js';
		}

		// Output the Sign in with Google script.
		printf( "\n<!-- %s -->\n", esc_html__( 'Sign in with Google button added by Site Kit', 'google-site-kit' ) );
		?>
		<style>
		.googlesitekit-sign-in-with-google__frontend-output-button{max-width:320px}
		.interim-login #login>.googlesitekit-sign-in-with-google__frontend-output-button{margin-bottom:16px}
		</style>
		<?php
		BC_Functions::wp_print_script_tag( array( 'src' => 'https://accounts.google.com/gsi/client' ) );
		BC_Functions::wp_print_script_tag(
			array(
				'data-siwg-config' => wp_json_encode( $config ),
				'src'              => plugins_url( "dist/assets/js/{$filename}", GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			)
		);
		printf( "\n<!-- %s -->\n", esc_html__( 'End Sign in with Google button added by Site Kit', 'google-site-kit' ) );
	}
}
