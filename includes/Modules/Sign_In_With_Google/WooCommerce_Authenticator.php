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
 * The authenticator class that processes SiwG callback requests to authenticate
 * users when WooCommerce is activated.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WooCommerce_Authenticator implements Authenticator {

	/**
	 * Gets the redirect URL for the error page.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $code Error code.
	 * @return string Redirect URL.
	 */
	protected function get_error_redirect_url( $code ) {
		wc_add_notice( apply_filters( 'login_errors', $code ), 'error' );
		do_action( 'woocommerce_login_failed' );

		return wc_get_page_permalink( 'myaccount' );
	}

	/**
	 * Gets the redirect URL after the user signs in with Google.
	 *
	 * @since n.e.x.t
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
