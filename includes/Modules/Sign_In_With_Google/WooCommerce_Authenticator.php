<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\WooCommerce_Authenticator
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Input;
use WP_Error;
use WP_User;

/**
 * The authenticator class used for Sign in with Google callback requests
 * made from WooCommerce-hosted pages (identified by an `integration=woocommerce`
 * POST value), customizing redirects to WooCommerce's own pages and hooks.
 *
 * WooCommerce's account-creation eligibility itself is checked by the base
 * `Authenticator` for every flow, not only this one, since requests from the
 * WordPress login page and One Tap there use the base class even when
 * WooCommerce is active. See `is_woocommerce_registration_open()` below,
 * the single source of truth for that eligibility check.
 *
 * @since 1.145.0
 * @since 1.186.0 No longer overrides registration-eligibility or default-role
 *                logic; that now lives in the base `Authenticator` so it
 *                applies to every auth flow, not only this one.
 * @access private
 * @ignore
 */
class WooCommerce_Authenticator extends Authenticator {

	/**
	 * Gets the redirect URL for the error page.
	 *
	 * @since 1.145.0
	 *
	 * @param string $code Error code.
	 * @return string Redirect URL.
	 */
	protected function get_error_redirect_url( $code ) {
		do_action( 'woocommerce_login_failed' );
		return add_query_arg( 'error', $code, wc_get_page_permalink( 'myaccount' ) );
	}

	/**
	 * Gets the redirect URL after the user signs in with Google.
	 *
	 * @since 1.145.0
	 * @since 1.146.0 Updated to take into account redirect URL from cookie.
	 *
	 * @param WP_User $user User object.
	 * @param Input   $input Input instance.
	 * @return string Redirect URL.
	 */
	protected function get_redirect_url( $user, $input ) {
		$redirect_to = wc_get_page_permalink( 'myaccount' );

		// If we have the redirect URL in the cookie, use it as the main redirect_to URL.
		$cookie_redirect_to = $this->get_cookie_redirect( $input );
		if ( ! empty( $cookie_redirect_to ) ) {
			$redirect_to = $cookie_redirect_to;
		}

		return apply_filters( 'woocommerce_login_redirect', $redirect_to, $user );
	}

	/**
	 * Checks whether WooCommerce's own account creation settings allow new
	 * accounts to be created, independently of the WordPress
	 * "Anyone can register" setting.
	 *
	 * This is the single source of truth for WooCommerce's own
	 * account-creation eligibility, used both by the base `Authenticator`
	 * (which handles auth requests without an `integration=woocommerce` POST
	 * value, e.g. the WordPress login page and One Tap there) and by
	 * `Sign_In_With_Google::inline_js_base_data()` for the `anyoneCanRegisterWooCommerce`
	 * flag read by the JS settings/setup screens.
	 *
	 * Mirrors the checks WooCommerce itself uses to decide whether to allow new
	 * accounts: showing the "My account" registration form
	 * (`woocommerce_enable_myaccount_registration`, checked directly in the
	 * `myaccount/form-login.php` template), allowing account creation at
	 * checkout (`WC_Checkout::is_registration_enabled()`, which filters
	 * `woocommerce_enable_signup_and_login_from_checkout` through
	 * `woocommerce_checkout_registration_enabled`), and allowing account
	 * creation after checkout completes (`woocommerce_enable_delayed_account_creation`,
	 * grouped with the other two under WooCommerce's own "Account creation"
	 * settings section).
	 *
	 * @since 1.186.0
	 *
	 * @return bool True if any WooCommerce account-creation setting is enabled, false otherwise.
	 */
	public static function is_woocommerce_registration_open() {
		if ( 'yes' === get_option( 'woocommerce_enable_myaccount_registration' ) ) {
			return true;
		}

		if ( 'yes' === get_option( 'woocommerce_enable_delayed_account_creation' ) ) {
			return true;
		}

		return (bool) apply_filters(
			'woocommerce_checkout_registration_enabled',
			'yes' === get_option( 'woocommerce_enable_signup_and_login_from_checkout' )
		);
	}
}
