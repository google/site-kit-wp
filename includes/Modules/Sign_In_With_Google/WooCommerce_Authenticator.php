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
 * The authenticator class that processes Sign in with Google callback
 * requests to authenticate users when WooCommerce is activated.
 *
 * @since 1.145.0
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
	 *
	 * @param WP_User $user User object.
	 * @param Input   $input Input instance.
	 * @return string Redirect URL.
	 */
	protected function get_redirect_url( $user, $input ) {
		$redirect = wc_get_page_permalink( 'myaccount' );
		return apply_filters( 'woocommerce_login_redirect', $redirect, $user );
	}
}
