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

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
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
	 * Registers tag hooks.
	 *
	 * @since 1.159.0
	 */
	public function register() {
		// Render the Sign in with Google script that converts placeholder
		// <div>s with Sign in with Google buttons.
		add_action( 'wp_footer', $this->get_method_proxy( 'render' ) );
		// Output the Sign in with Google JS on the WordPress login page.
		add_action( 'login_footer', $this->get_method_proxy( 'render' ) );

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
	 */
	protected function render() {
		$is_woocommerce       = class_exists( 'woocommerce' );
		$is_woocommerce_login = did_action( 'woocommerce_login_form_start' );

		$login_uri = add_query_arg( 'action', 'googlesitekit_auth', wp_login_url() );

		$btn_args = array(
			'theme' => $this->settings['theme'],
			'text'  => $this->settings['text'],
			'shape' => $this->settings['shape'],
		);

		// Whether this is a WordPress/WooCommerce login page.
		$is_login_page = $this->is_wp_login || $is_woocommerce_login;

		// Check to see if we should show the One Tap prompt on this page.
		//
		// Show the One Tap prompt if:
		// 1. One Tap is enabled in settings.
		// 2. The user is not logged in.
		$should_show_one_tap_prompt = ! empty( $this->settings['oneTapEnabled'] ) && ! is_user_logged_in();

		// Set the cookie time to live to 5 minutes. If the redirect_to is
		// empty, set the cookie to expire immediately.
		$cookie_expire_time = 300000;
		if ( empty( $this->redirect_to ) ) {
			$cookie_expire_time *= -1;
		}

		// Render the Sign in with Google script.
		ob_start();

		?>
( () => {
	async function handleCredentialResponse( response ) {
		<?php if ( $is_woocommerce && ! $this->is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		response.integration = 'woocommerce';
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		try {
			const res = await fetch( '<?php echo esc_js( $login_uri ); ?>', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams( response )
			} );

			<?php if ( empty( $this->redirect_to ) && ! $is_login_page && $should_show_one_tap_prompt ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
				location.reload();
			<?php else : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
				if ( res.ok && res.redirected ) {
					location.assign( res.url );
				}
			<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		} catch( error ) {
			console.error( error );
		}
	}

	google.accounts.id.initialize( {
		client_id: '<?php echo esc_js( $this->settings['clientID'] ); ?>',
		callback: handleCredentialResponse,
		library_name: 'Site-Kit'
	} );

	<?php if ( $this->is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		const buttonDivToAddToLoginForm = document.createElement( 'div' );
		buttonDivToAddToLoginForm.classList.add( 'googlesitekit-sign-in-with-google__frontend-output-button' );

		document.getElementById( 'login' ).insertBefore( buttonDivToAddToLoginForm, document.getElementById( 'loginform' ) );
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	<?php if ( ! is_user_logged_in() || $this->is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
			<?php
			/**
			 * Render SiwG buttons for all `<div>` elements with the "magic
			 * class" on the page.
			 *
			 * Mainly used by Gutenberg blocks.
			 */
			?>
	const defaultButtonOptions = <?php echo wp_json_encode( $btn_args ); ?>;
	document.querySelectorAll( '.googlesitekit-sign-in-with-google__frontend-output-button' ).forEach( ( siwgButtonDiv ) => {
		const buttonOptions = {
			shape: siwgButtonDiv.getAttribute( 'data-googlesitekit-siwg-shape' ) || defaultButtonOptions.shape,
			text: siwgButtonDiv.getAttribute( 'data-googlesitekit-siwg-text' ) || defaultButtonOptions.text,
			theme: siwgButtonDiv.getAttribute( 'data-googlesitekit-siwg-theme' ) || defaultButtonOptions.theme,
		};

		google.accounts.id.renderButton( siwgButtonDiv, buttonOptions );
	});
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	<?php if ( $should_show_one_tap_prompt ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		google.accounts.id.prompt();
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	<?php if ( ! empty( $this->redirect_to ) ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		const expires = new Date();
		expires.setTime( expires.getTime() + <?php echo esc_js( $cookie_expire_time ); ?> );
		document.cookie = "<?php echo esc_js( Authenticator::COOKIE_REDIRECT_TO ); ?>=<?php echo esc_js( $this->redirect_to ); ?>;expires=" + expires.toUTCString() + ";path=<?php echo esc_js( Authenticator::get_cookie_path() ); ?>";
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
} )();
		<?php

		// Strip all whitespace and unnecessary spaces.
		$inline_script = preg_replace( '/\s+/', ' ', ob_get_clean() );
		$inline_script = preg_replace( '/\s*([{};\(\)\+:,=])\s*/', '$1', $inline_script );

		// Output the Sign in with Google script.
		printf( "\n<!-- %s -->\n", esc_html__( 'Sign in with Google button added by Site Kit', 'google-site-kit' ) );
		BC_Functions::wp_print_script_tag( array( 'src' => 'https://accounts.google.com/gsi/client' ) );
		BC_Functions::wp_print_inline_script_tag( $inline_script );
		printf( "\n<!-- %s -->\n", esc_html__( 'End Sign in with Google button added by Site Kit', 'google-site-kit' ) );
	}
}
