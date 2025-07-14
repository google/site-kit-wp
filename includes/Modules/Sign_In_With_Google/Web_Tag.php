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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait;

	/**
	 * Module settings.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var \Google\Site_Kit\Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string                   $tag_id      Tag ID.
	 * @param string                   $module_slug Module slug.
	 * @param Settings                 $settings    Module settings instance.
	 * @param \Google\Site_Kit\Context $context     Context instance.
	 */
	public function __construct( $tag_id, $module_slug, Settings $settings, \Google\Site_Kit\Context $context ) {
		parent::__construct( $tag_id, $module_slug );
		$this->settings = $settings;
		$this->context  = $context;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// Render the Sign in with Google script that converts placeholder
		// <div>s with Sign in with Google buttons.
		add_action( 'wp_footer', $this->get_method_proxy( 'render_signinwithgoogle_scripts' ) );
		// Output the Sign in with Google JS on the WordPress login page.
		add_action( 'login_footer', $this->get_method_proxy( 'render_signinwithgoogle_scripts' ) );

		$this->do_init_tag_action();
	}

	/**
	 * Renders the Sign in with Google JS script tags, One Tap code, and
	 * buttons.
	 *
	 * @since 1.139.0
	 * @since 1.144.0 Renamed to `render_signinwithgoogle` and conditionally
	 *                rendered the code to replace buttons.
	 * @since n.e.x.t moved from main Sign_In_With_Google class to Web_Tag.
	 */
	protected function render_signinwithgoogle_scripts() {
		// `is_login()` isn't available until WP 6.1.
		$is_wp_login          = false !== stripos( wp_login_url(), $_SERVER['SCRIPT_NAME'] ?? '' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$is_woocommerce       = class_exists( 'woocommerce' );
		$is_woocommerce_login = did_action( 'woocommerce_login_form_start' );

		$settings  = $this->settings->get();
		$login_uri = add_query_arg( 'action', 'googlesitekit_auth', wp_login_url() );

		$redirect_to = $this->context->input()->filter( INPUT_GET, 'redirect_to' );
		if ( ! empty( $redirect_to ) ) {
			$redirect_to = trim( $redirect_to );
		}

		$btn_args = array(
			'theme' => $settings['theme'],
			'text'  => $settings['text'],
			'shape' => $settings['shape'],
		);

		// Whether this is a WordPress/WooCommerce login page.
		$is_login_page = $is_wp_login || $is_woocommerce_login;

		// Check to see if we should show the One Tap prompt on this page.
		//
		// If this is not the WordPress or WooCommerce login page, check to
		// see if "One Tap enabled on all pages" is set first. If it isnt:
		// don't render the Sign in with Google JS.
		$should_show_one_tap_prompt = ! empty( $settings['oneTapEnabled'] ) && (
			// If One Tap is enabled at all, it should always appear on a login
			// page.
			$is_login_page ||
			// Only show the prompt on other pages if the setting is enabled and
			// the user isn't already signed in.
			( $settings['oneTapOnAllPages'] && ! is_user_logged_in() )
		);

		// Set the cookie time to live to 5 minutes. If the redirect_to is
		// empty, set the cookie to expire immediately.
		$cookie_expire_time = 300000;
		if ( empty( $redirect_to ) ) {
			$cookie_expire_time *= -1;
		}

		// Render the Sign in with Google script.
		ob_start();

		?>
( () => {
	async function handleCredentialResponse( response ) {
		<?php if ( $is_woocommerce && ! $is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		response.integration = 'woocommerce';
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		try {
			const res = await fetch( '<?php echo esc_js( $login_uri ); ?>', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams( response )
			} );

			<?php if ( empty( $redirect_to ) && ! $is_login_page && $should_show_one_tap_prompt ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
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
		client_id: '<?php echo esc_js( $settings['clientID'] ); ?>',
		callback: handleCredentialResponse,
		library_name: 'Site-Kit'
	} );

	<?php if ( $is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		const buttonDivToAddToLoginForm = document.createElement( 'div' );
		buttonDivToAddToLoginForm.classList.add( 'googlesitekit-sign-in-with-google__frontend-output-button' );

		document.getElementById( 'login' ).insertBefore( buttonDivToAddToLoginForm, document.getElementById( 'loginform' ) );
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	<?php if ( ! is_user_logged_in() || $is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
			<?php
			/**
			 * Render SiwG buttons for all `<div>` elements with the "magic
			 * class" on the page.
			 *
			 * Mainly used by Gutenberg blocks.
			 */
			?>
		document.querySelectorAll( '.googlesitekit-sign-in-with-google__frontend-output-button' ).forEach( ( siwgButtonDiv ) => {
			google.accounts.id.renderButton( siwgButtonDiv, <?php echo wp_json_encode( $btn_args ); ?> );
		});
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	<?php if ( $should_show_one_tap_prompt ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		google.accounts.id.prompt();
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	<?php if ( ! empty( $redirect_to ) ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		const expires = new Date();
		expires.setTime( expires.getTime() + <?php echo esc_js( $cookie_expire_time ); ?> );
		document.cookie = "<?php echo esc_js( Authenticator::COOKIE_REDIRECT_TO ); ?>=<?php echo esc_js( $redirect_to ); ?>;expires=" + expires.toUTCString() + ";path=<?php echo esc_js( Authenticator::get_cookie_path() ); ?>";
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
} )();
		<?php

		// Strip all whitespace and unnecessary spaces.
		$inline_script = preg_replace( '/\s+/', ' ', ob_get_clean() );
		$inline_script = preg_replace( '/\s*([{};\(\)\+:,=])\s*/', '$1', $inline_script );

		// Output the Sign in with Google script.
		print( "\n<!-- Sign in with Google button added by Site Kit -->\n" );
		BC_Functions::wp_print_script_tag( array( 'src' => 'https://accounts.google.com/gsi/client' ) );
		BC_Functions::wp_print_inline_script_tag( $inline_script );
		print( "\n<!-- End Sign in with Google button added by Site Kit -->\n" );
	}

	/**
	 * Outputs snippet.
	 *
	 * @since n.e.x.t
	 */
	protected function render() {
		// Do nothing, script is rendered via hooks.
	}
}
